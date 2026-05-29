import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NEONOIR | グラフィティジェネレーター',
  description: '写真をネオノワール風グラフィティアートに変換するAIジェネレーター',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ja" className={inter.className}>
      <body>
        <Navbar isLoggedIn={!!user} />
        <main>{children}</main>
      </body>
    </html>
  );
}
