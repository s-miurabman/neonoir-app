import Link from 'next/link';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <span className={styles.eyebrow}>AI グラフィティジェネレーター</span>

      <h1 className={styles.title}>
        あなたの写真を<br />
        <span className={styles.accent}>NEONOIR</span><br />
        アートに変換
      </h1>

      <p className={styles.subtitle}>
        写真をアップロードするだけで、AIがホットピンク×ブラックの
        2色リソグラフ風グラフィティアートに変換します。
      </p>

      <div className={styles.actions}>
        <Link href="/login" className={styles.btnPrimary}>
          無料で始める
        </Link>
        <Link href="#features" className={styles.btnSecondary}>
          詳しく見る
        </Link>
      </div>

      <div className={styles.features} id="features">
        <div className={styles.feature}>
          <div className={styles.featureIcon}>⚡</div>
          <h3 className={styles.featureTitle}>高速生成</h3>
          <p className={styles.featureText}>
            AIが数秒でグラフィティアートを生成します
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🎨</div>
          <h3 className={styles.featureTitle}>独自スタイル</h3>
          <p className={styles.featureText}>
            ホットピンク×ブラックの2色リソグラフ風スタイル
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>📁</div>
          <h3 className={styles.featureTitle}>履歴保存</h3>
          <p className={styles.featureText}>
            生成した作品をクラウドに保存して管理
          </p>
        </div>
      </div>
    </section>
  );
}
