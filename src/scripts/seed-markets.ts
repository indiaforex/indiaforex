import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2'; // Class

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

// Which assets do we want to open predictions for?
const FEATURED_ASSETS = [
    { symbol: 'USDINR=X', name: 'USD/INR' },
    { symbol: 'EURINR=X', name: 'EUR/INR' },
    { symbol: 'RELIANCE.NS', name: 'Reliance' },
    { symbol: '^NSEI', name: 'NIFTY 50' }
];

async function main() {
    console.log("🌱 Seeding Prediction Markets for TODAY...");

    // 1. Get Today's Date (UTC or IST?) -> Storing as YYYY-MM-DD
    const today = new Date();
    // Simple ISO date YYYY-MM-DD
    const targetDate = today.toISOString().split('T')[0];

    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

    for (const asset of FEATURED_ASSETS) {
        // Check if exists
        const { data: existing } = await supabase
            .from('prediction_markets')
            .select('id')
            .eq('symbol', asset.symbol)
            .eq('target_date', targetDate)
            .single();

        if (existing) {
            console.log(`[SKIP] Market for ${asset.symbol} (${targetDate}) already exists.`);
            continue;
        }

        // Fetch current price as "Open Price" (Reference)
        // In reality, this should be the actual Open, but for "Next 24h" prediction, current price is fine.
        let openPrice = 0;
        try {
            const quote = await yf.quote(asset.symbol);
            openPrice = quote.regularMarketPrice || 0;
        } catch (e) {
            console.error(`Failed to fetch price for ${asset.symbol}`);
            continue;
        }

        if (openPrice === 0) continue;

        const { error } = await supabase.from('prediction_markets').insert({
            symbol: asset.symbol,
            target_date: targetDate,
            open_price: openPrice,
            status: 'OPEN'
        });

        if (!error) {
            console.log(`[CREATED] Market: Will ${asset.name} close > ${openPrice}?`);
        } else {
            console.error(`[ERROR] ${asset.symbol}:`, error.message);
        }
    }

    console.log("✅ Seeding Complete.");
}

main();
