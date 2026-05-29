'use client';

import styles from './ResultPanel.module.css';

interface ResultPanelProps {
  isGenerating: boolean;
  watermarkedBase64: string | null;
  isSaved: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export default function ResultPanel({
  isGenerating,
  watermarkedBase64,
  isSaved,
  onSave,
  isSaving,
}: ResultPanelProps) {
  const handleDownload = () => {
    if (!watermarkedBase64) return;
    const a = document.createElement('a');
    a.href = watermarkedBase64;
    a.download = `neonoir_${Date.now()}.png`;
    a.click();
  };

  if (isGenerating) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>グラフィティを生成中...</p>
      </div>
    );
  }

  if (!watermarkedBase64) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderIcon}>🎨</span>
        <p className={styles.placeholderText}>生成結果がここに表示されます</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={watermarkedBase64}
        alt="生成されたグラフィティアート"
        className={styles.resultImage}
      />

      <div className={styles.actions}>
        <button className={styles.btn} onClick={handleDownload}>
          ⬇ ダウンロード
        </button>

        {isSaved ? (
          <span className={styles.savedBadge}>✓ 履歴に保存済み</span>
        ) : (
          <button
            className={`${styles.btn} ${styles.btnPink}`}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '📁 履歴に保存'}
          </button>
        )}
      </div>
    </div>
  );
}
