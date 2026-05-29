import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

// ユーザーごとのレート制限 (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000; // 1分

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function buildGraffitiPrompt(text: string): string {
  return (
    `Redraw the person from this photo as a 2-color risograph/screen-print manga illustration on a graffiti background. ` +
    `LIKENESS IS TOP PRIORITY — do NOT alter, idealize, or improve any feature. ` +
    `Keep EXACTLY: eye shape and how open/closed they are, eyebrow shape, nose, mouth, ` +
    `facial expression, head angle, body pose. Do NOT open eyes wider, do NOT beautify. ` +
    `CHARACTER: bold varying-thickness black ink outlines, flat cel-shading, ` +
    `COLOR 1 deep black, COLOR 2 hot pink (#FF1493), BASE cream/off-white. NO other colors. ` +
    `Risograph grain texture, Japanese manga aesthetic. ` +
    `BACKGROUND: fill every pixel with "${text}" repeated as graffiti tag lettering — ` +
    `bold handwritten urban script, paint drips, overlapping densely. Hot pink on deep black. ` +
    `RESULT: unified 2-color — only hot pink, black, and cream/white.`
  );
}

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です。' },
        { status: 401 }
      );
    }

    // レート制限
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: 'レート制限: 1分間に5回まで生成できます。しばらくお待ちください。' },
        { status: 429 }
      );
    }

    // フォームデータ取得
    const formData = await request.formData();
    const photo = formData.get('photo') as File | null;
    const graffitiText = formData.get('graffitiText') as string | null;

    if (!photo || !graffitiText) {
      return NextResponse.json(
        { success: false, error: 'photoとgraffitiTextが必要です。' },
        { status: 400 }
      );
    }

    if (!graffitiText.trim()) {
      return NextResponse.json(
        { success: false, error: 'グラフィティテキストを入力してください。' },
        { status: 400 }
      );
    }

    // OpenAI API呼び出し
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = buildGraffitiPrompt(graffitiText.trim());

    const response = await openai.images.edit({
      model: 'gpt-image-2',
      image: photo,
      prompt,
      size: '1024x1536',
      response_format: 'b64_json',
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error('画像の生成に失敗しました。');
    }

    return NextResponse.json({ success: true, imageBase64 });
  } catch (err) {
    console.error('Generate API error:', err);
    const message = err instanceof Error ? err.message : '予期しないエラーが発生しました。';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
