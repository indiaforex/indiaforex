import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function main() {
    console.log("🔍 Checking Prediction Markets...");

    // Check Count
    const { count, error } = await supabase
        .from('prediction_markets')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Markets: ${count}`);

    // Check Today's Markets
    // We need to exactly match the logic in PredictionList.tsx
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking for Target Date: ${today}`);

    const { data: markets, error: dataError } = await supabase
        .from('prediction_markets')
        .select('*')
        .eq('status', 'OPEN')
        .eq('target_date', today);

    if (dataError) console.error("Error:", dataError);

    console.log("Markets Found:", markets);
}

main();
