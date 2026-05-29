import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import HistoryGrid, { type Generation } from '@/components/HistoryGrid';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: generations, error } = await supabase
    .from('generations')
    .select('id, graffiti_text, image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items: Generation[] = error ? [] : (generations ?? []);

  return <HistoryGrid initialItems={items} />;
}
