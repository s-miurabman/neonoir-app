# NEONOIR グラフィティジェネレーター — Claude Code コンテキスト

## プロジェクト概要
写真をアップロードするとAI（OpenAI gpt-image-2）がグラフィティアートに変換するWebサービス。
- **本番URL**: https://app.neonoir.jp
- **Vercel alias**: https://neonoir-app.vercel.app
- **GitHub**: https://github.com/s-miurabman/neonoir-app
- **Supabase project ref**: `ksbkjwrjyaqpkqlkhmez`

---

## 技術スタック
- **Next.js 14** (App Router, TypeScript, CSS Modules)
- **Supabase** (Auth + PostgreSQL) — Storage は**使っていない**（コスト削減のため廃止）
- **OpenAI** gpt-image-2（画像生成）、gpt-4o-mini（写真分析）
- **Resend** (メール送信) — `noreply@neonoir.jp` から送信
- **Vercel** デプロイ
- **sharp** (サーバーサイドPNG→JPEG変換)

---

## ディレクトリ構成

```
app/
  api/
    generate/route.ts       # 画像生成 + 写真メタデータ分析（並列）
    save-generation/route.ts # Storage保存（UIから削除済み、ファイルは残存）
    send-email/route.ts     # Supabase Auth Hook → Resend経由でメール送信
  auth/
    callback/route.ts       # OAuth/パスワードリセットコールバック
    confirm/route.ts        # メール確認リンク処理
  history/page.tsx          # 履歴ページ（UIから非表示、ルートは残存）
  login/page.tsx            # ログイン・新規登録（メール確認必須）
  update-password/page.tsx  # パスワード更新ページ
  page.tsx                  # メインページ（未ログイン:ヒーロー / ログイン:ジェネレーター）
  layout.tsx                # Navbar + Footer

components/
  GeneratorPanel.tsx        # 生成フロー全体の管理（ヒーロー＋フォーム）
  ResultPanel.tsx           # 生成結果表示・ダウンロード・ずんだ格言ローディング
  VideoSection.tsx          # 動画生成（WebCodecs + MediaRecorder fallback）
  PhotoUpload.tsx           # ドラッグ&ドロップ対応アップロード
  Navbar.tsx                # ロゴ（logo-neonoir.png）・ログアウトボタン
  HeroSection.tsx           # 未ログイン時のランディング

utils/
  imageUtils.ts             # toRGBAPng（1024px）/ applyLogoWatermark（JPEG出力）

public/
  logo-neonoir.png          # NEONOIRロゴ（Navbar・ウォーターマーク用）
  hero-headline.png         # CREATE. DESTROY. REWRITE.（ヒーローテキスト画像）
  hero-image.png            # グラフィティアーティストKV画像
  icon-upload.png           # アップロードゾーンアイコン
  icon-placeholder.png      # 生成結果プレースホルダーアイコン
  loading.gif               # ピクセルアートキャラクターのローディングGIF
  zunda.png                 # ずんだキャラクター（NEONOIRグラフィティ版）
```

---

## 重要な設計決定

### 画像フロー
1. クライアント: `toRGBAPng()` で1024pxにリサイズ → base64 DataURL
2. `/api/generate` にJSON POSTで送信（FormDataではない、Vercel 6MB上限対策）
3. サーバー: `sharp` でPNG→JPEG変換（4MB→約500KB）してクライアントに返す
4. クライアント: `applyLogoWatermark()` でNEONOIRロゴ＋@neonoir_jp合成
5. JPEG DataURLとして表示・ダウンロード

### 写真は保存しない
- 生成に使った写真はサーバーで即破棄
- 生成画像もStorageに保存しない（2024年に廃止）
- 代わりに**メタデータのみ** `generation_analytics` テーブルに保存

### 動画生成
- WebCodecs → H.264 MP4（Chrome/Edge）
- MediaRecorder → MP4/WebM（Safari fallback）
- 14秒: Phase1(フィルムグレイン+スキャン) → Phase2(チャンネルスプリット遷移) → Phase3(静止) → Phase4(ロゴ出現) → ホールド

### ウォーターマーク
- `logo-neonoir.png` を左下に配置（白変換: source-in合成でiOS Safari対応）
- `@neonoir_jp` を右下にテキスト
- `applyLogoWatermark()` in `utils/imageUtils.ts`

---

## DBテーブル

### `generation_analytics`（アナリティクス）
```
user_id, graffiti_text, subject_category, subject_details(jsonb),
brand_name, environment, time_of_day, season, dominant_colors(jsonb), created_at
```
- 毎回の生成で自動保存（gpt-4o-mini Visionで写真を分析）
- ユーザーからは非表示・管理者のみアクセス

### `generations`（旧・現在は未使用）
- 履歴機能廃止に伴い現在は何もINSERTされていない

---

## AIプロンプト設計（`/api/generate/route.ts`）

### 被写体ルール
- **(A) 人物**: 似顔絵マンガ化（LIKENESS最優先）
- **(B) 動物・ペット**: 自然な顔を保ちながらマンガキャラ化（NNロゴ顔NG）
- **(C) 物・食べ物**: NNアイ＋スマイル＋VANSスニーカーのキャラ
- **(D) 街・都市風景**: NNグラフィティが描かれた都市イラスト

### スタイル固定
- 2カラー: 黒 / ホットピンク #FA1773 / クリーム
- Risograph グレインテクスチャ + 日本のマンガ美学

---

## 認証フロー
- Supabase Auth（メール＋パスワード）
- メール確認**必須**（`mailer_autoconfirm: false`）
- 確認メール送信: Supabase Auth Hook → `/api/send-email` → Resend API
- 新規登録**無効化中**（`enable_signup: false`）— テスト中のため非公開

---

## デザインシステム
```css
--pink:      #FA1773;
--bg:        #000000;
--surface:   #161616;
--surface2:  #1e1e1e;
--border:    #282828;
--text1:     #f0f0f0;
--text2:     #888;
--text3:     #444;
```
- フォント: Inter（Google Fonts）
- CSS Modules（Tailwind不使用）
- コンテナ幅: 1080px
- ブレークポイント: タブレット 769-1024px / スマホ ≤768px

---

## ローディング演出（ResultPanel）
- `loading.gif`: ピクセルアートキャラクターのGIF
- `zunda.png`: NEONOIRグラフィティスタイルのずんだキャラ
- 格言: 50本のものづくり格言（本田宗一郎・ピカソ・エジソンなど）を東北弁+ずんだ口調で表示
- 13秒ごとにシャッフルローテーション

---

## Vercel環境変数（設定済み）
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
SUPABASE_HOOK_SECRET
NEXT_PUBLIC_APP_URL=https://app.neonoir.jp
NEXT_PUBLIC_WATERMARK_HANDLE=@neonoir_jp
```

---

## デプロイコマンド
```bash
cd "/Users/s-miura/Library/CloudStorage/Dropbox/Derario Creative/作業中/00_cloude_code_ツール開発/neonoir-app"
vercel --prod --yes
```
Vercel account: `s-miurabman`

---

## DNS（ムームーDNS / neonoir.jp）
- `app.neonoir.jp` → Vercel（A: 76.76.21.21）
- `neonoir.jp` → 将来のブランドTOP用に確保
- Resendのメール送信ドメイン認証済み（DKIM/SPF/DMARC設定済み）

---

## 既知の制限・注意事項
- 服を着ていない人形・ヌードフィギュアはOpenAI安全フィルターで弾かれる（正常動作）
- 生成画像はセッション終了で消える（意図的設計）
- `neonoir-app/.env.local` はgitignoreされているが実値が入っている（コミット不可）
- Supabaseの新キー形式（`sb_publishable_`/`sb_secret_`）を使用

---

*最終更新: 2026-05-31*
