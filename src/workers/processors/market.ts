import { Job } from 'bullmq';
import YahooFinance from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import { redisConnection } from '../../lib/redis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.warn("WARN: SUPABASE_SERVICE_ROLE_KEY missing. Worker cannot write to DB.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || 'placeholder', {
    auth: { persistSession: false }
});

export interface MarketJobData {
    action?: 'sync-all';
    symbol?: string;
    interval?: '1m' | '1d';
}

const TARGET_SYMBOLS = [
    // Indices
    '^NSEI', '^NSEBANK', '^BSESN', '^GSPC',
    // Crypto/Comms
    'BTC-USD', 'GC=F', 'CL=F',
    // Forex (INR)
    'USDINR=X', 'EURINR=X', 'GBPINR=X', 'JPYINR=X', 'INR=X',
    // Forex (Majors)
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCHF=X', 'USDCAD=X',
    // Indian Stocks (Top 10)
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LICI.NS', 'LT.NS'
];

export const marketProcessor = async (job: Job<MarketJobData>) => {
    // console.log(`[Market] Batch Syncing ${TARGET_SYMBOLS.length} symbols...`);

    const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const timestamp = new Date();
    const snapshot: Record<string, any> = {};
    const dbRows: any[] = [];

    try {
        // 1. Fetch All in ONE HTTP Request (Native Batch)
        // yahoo-finance2 supports passing an array of symbols
        const results = await yf.quote(TARGET_SYMBOLS);

        for (const quote of results) {
            const price = quote.regularMarketPrice;
            if (!price) continue;

            const symbol = quote.symbol;

            // Populate Snapshot for Cache
            snapshot[symbol] = {
                price,
                change: quote.regularMarketChangePercent || 0,
                updatedAt: timestamp.toISOString()
            };

            // Prepare DB Row
            if (supabaseServiceKey) {
                dbRows.push({
                    symbol,
                    interval: '1m',
                    bucket: timestamp.toISOString(),
                    open: quote.regularMarketOpen || price,
                    high: quote.regularMarketDayHigh || price,
                    low: quote.regularMarketDayLow || price,
                    close: price,
                    volume: quote.regularMarketVolume || 0
                });
            }
        }

        // 3. Update Redis Cache
        const pipeline = redisConnection.pipeline();

        // A. Set Global Snapshot
        pipeline.set('market:snapshot', JSON.stringify(snapshot));

        // B. Set Individual Keys for Alerts (Phase 4)
        for (const sym in snapshot) {
            pipeline.set(`PRICE:${sym}`, snapshot[sym].price);
        }

        await pipeline.exec();

        // 4. Update Database (Batch Insert)
        if (dbRows.length > 0) {
            const { error } = await supabase.from('market_candles').insert(dbRows);
            if (error && error.code !== '23505') {
                console.error(`[Market] DB Batch Insert Error: ${error.message}`);
            } else {
                // Log success only occasionally or if needed
                console.log(`[Market] Synced ${results.length} symbols @ ${timestamp.toLocaleTimeString()}`);
            }
        }

        return { status: 'success', count: results.length };

    } catch (e: any) {
        console.error(`[Market] Batch Fetch Failed: ${e.message}`);
        throw e;
    }
};
