import { getEvents } from "@/lib/sheetdb";
import { getRecentThreads } from "@/lib/forum";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { createClient } from "@/lib/supabase/server";

async function getPredictions() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('prediction_markets' as any)
    .select('*')
    .neq('status', 'CANCELLED')
    .eq('target_date', today)
    .order('created_at', { ascending: true })
    .limit(10);
  return data || [];
}

async function getUserData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, points: 0, bets: [] };
  }

  // Fetch Profile for Points
  const { data: profile } = await supabase
    .from('profiles')
    .select('reputation_points')
    .eq('id', user.id)
    .single();

  // Fetch Recent Bets
  const { data: bets } = await supabase
    .from('market_bets')
    .select('*, prediction_markets(symbol)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    user,
    points: profile?.reputation_points || 0,
    bets: bets || []
  };
}

export default async function Home() {
  const events = await getEvents();
  const threads = await getRecentThreads();
  const predictions = await getPredictions();
  const { user, points, bets } = await getUserData();

  return (
    <DashboardClient
      events={events}
      threads={threads}
      predictions={predictions}
      user={user}
      userPoints={points}
      userBets={bets}
    />
  );
}
