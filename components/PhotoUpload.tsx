'use client';

import { useState, DragEvent, ChangeEvent } from 'react';
import styles from './PhotoUpload.module.css';

interface PhotoUploadProps {
  onFileSelect: (file: File | null) => void;
}

export default function PhotoUpload({ onFileSelect }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onFileSelect(null);
  };

  if (preview) {
    return (
      <div className={styles.preview}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="アップロード画像プレビュー" />
        <button className={styles.clearBtn} onClick={handleClear} aria-label="画像を削除">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        aria-label="写真をアップロード"
      />
      <span className={styles.icon}>📷</span>
      <p className={styles.label}>
        写真をドラッグ＆ドロップ<br />またはクリックして選択
      </p>
      <span className={styles.hint}>JPEG / PNG / WEBP</span>
    </div>
  );
}
