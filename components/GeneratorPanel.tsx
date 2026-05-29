'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PhotoUpload from './PhotoUpload';
import ResultPanel from './ResultPanel';
import { toRGBAPng, applyLogoWatermark } from '@/utils/imageUtils';
import { createClient } from '@/lib/supabase/client';
import styles from './GeneratorPanel.module.css';

interface GeneratorPanelProps {
  userId: string;
}

export default function GeneratorPanel({ userId }: GeneratorPanelProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [graffitiText, setGraffitiText] = useState('NEONOIR');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [watermarkedBase64, setWatermarkedBase64] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!photoFile) {
      setError('写真をアップロードしてください。');
      return;
    }
    if (!graffitiText.trim()) {
      setError('グラフィティテキストを入力してください。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultBase64(null);
    setWatermarkedBase64(null);
    setIsSaved(false);

    try {
      // 1. Canvas APIでPNG変換
      const pngBlob = await toRGBAPng(photoFile);

      // 2. API呼び出し
      const formData = new FormData();
      formData.append('photo', pngBlob, 'photo.png');
      formData.append('graffitiText', graffitiText.trim());

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '生成に失敗しました。');
      }

      // 3. ウォーターマーク適用
      const handle = process.env.NEXT_PUBLIC_WATERMARK_HANDLE || '@neonoir_jp';
      const clean = data.imageBase64 as string;
      const watermarked = await applyLogoWatermark(clean, handle);

      setResultBase64(clean);
      setWatermarkedBase64(watermarked);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!watermarkedBase64) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const uuid = uuidv4();

      // base64 → Blob
      const res = await fetch(watermarkedBase64);
      const blob = await res.blob();

      // Supabase Storage アップロード
      const path = `generations/${userId}/${uuid}.png`;
      const { error: uploadError } = await supabase.storage
        .from('generations')
        .upload(path, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // 公開URL取得
      const { data: urlData } = supabase.storage
        .from('generations')
        .getPublicUrl(path);

      const imageUrl = urlData.publicUrl;

      // DB INSERT
      const { error: insertError } = await supabase
        .from('generations')
        .insert({
          user_id: userId,
          graffiti_text: graffitiText.trim(),
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      setIsSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>グラフィティジェネレーター</h1>
      <p className={styles.subtitle}>写真をアップロードしてグラフィティアートに変換しましょう</p>

      <div className={styles.grid}>
        {/* 左パネル: 入力 */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>設定</p>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>写真をアップロード</label>
            <PhotoUpload onFileSelect={(file) => { setPhotoFile(file); setIsSaved(false); }} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="graffitiText">
              グラフィティテキスト
            </label>
            <input
              id="graffitiText"
              type="text"
              className={styles.input}
              value={graffitiText}
              onChange={(e) => setGraffitiText(e.target.value)}
              placeholder="例: NEONOIR, あなたの名前..."
              maxLength={50}
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={isGenerating || !photoFile}
          >
            {isGenerating ? '生成中...' : '⚡ グラフィティを生成'}
          </button>
        </div>

        {/* 右パネル: 結果 */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>生成結果</p>
          <ResultPanel
            isGenerating={isGenerating}
            watermarkedBase64={watermarkedBase64}
            isSaved={isSaved}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
