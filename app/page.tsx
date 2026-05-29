import { createClient } from '@/lib/supabase/server';
import GeneratorPanel from '@/components/GeneratorPanel';
import HeroSection from '@/components/HeroSection';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <GeneratorPanel userId={user.id} />;
  }

  return <HeroSection />;
}
