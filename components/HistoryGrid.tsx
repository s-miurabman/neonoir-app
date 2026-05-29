'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './HistoryGrid.module.css';

export interface Generation {
  id: string;
  graffiti_text: string;
  image_url: string;
  created_at: string;
}

interface HistoryGridProps {
  initialItems: Generation[];
}

export default function HistoryGrid({ initialItems }: HistoryGridProps) {
  const [items, setItems] = useState<Generation[]>(initialItems);
  const [modalItem, setModalItem] = useState<Generation | null>(null);

  const handleDownload = async (item: Generation, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = item.image_url;
    a.download = `neonoir_${item.graffiti_text}_${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  const handleDelete = async (item: Generation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('この画像を削除しますか？')) return;

    const supabase = createClient();

    // Storage削除: URLからパスを抽出
    try {
      const url = new URL(item.image_url);
      const pathMatch = url.pathname.match(/\/generations\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from('generations').remove([pathMatch[1]]);
      }
    } catch {
      // Storage削除失敗は無視してDB削除を続行
    }

    // DB削除
    await supabase.from('generations').delete().eq('id', item.id);
    setItems((prev) => prev.filter((g) => g.id !== item.id));
    if (modalItem?.id === item.id) setModalItem(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>生成履歴</h1>
        <span className={styles.count}>{items.length}件</span>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎨</span>
          <p className={styles.emptyText}>まだ生成した画像がありません</p>
          <p className={styles.emptyHint}>
            <Link href="/">ジェネレーターで作成</Link>してみましょう
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div
              key={item.id}
              className={styles.card}
              onClick={() => setModalItem(item)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.graffiti_text} loading="lazy" />
              <div className={styles.cardBody}>
                <span className={styles.cardText}>{item.graffiti_text}</span>
                <div className={styles.cardActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={(e) => handleDownload(item, e)}
                    title="ダウンロード"
                  >
                    ⬇
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={(e) => handleDelete(item, e)}
                    title="削除"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {modalItem && (
        <div className={styles.modalOverlay} onClick={() => setModalItem(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={modalItem.image_url} alt={modalItem.graffiti_text} />
            <button
              className={styles.modalClose}
              onClick={() => setModalItem(null)}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
