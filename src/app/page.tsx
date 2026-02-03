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

export default async function Home() {
  const events = await getEvents();
  const threads = await getRecentThreads();
  const predictions = await getPredictions();

  return (
    <DashboardClient events={events} threads={threads} predictions={predictions} />
  );
}
