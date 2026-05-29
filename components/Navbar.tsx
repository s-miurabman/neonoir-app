'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

interface NavbarProps {
  isLoggedIn: boolean;
}

export default function Navbar({ isLoggedIn }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          NEONOIR
        </Link>

        <div className={styles.actions}>
          {isLoggedIn ? (
            <>
              <Link href="/history" className={styles.navLink}>
                履歴
              </Link>
              <button onClick={handleSignOut} className={styles.btn}>
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login" className={`${styles.btn} ${styles.btnPink}`}>
              ログイン / 登録
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
