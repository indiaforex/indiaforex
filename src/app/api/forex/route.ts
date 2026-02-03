import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2'; // Use Class import
import { upstashRedis } from '@/lib/redis';

// Set revalidate to 0 because we handle caching via Redis (which is updated by Worker)
export const revalidate = 0;

const FOREX_PAIRS = [
    // INR Pairs (Priority)
    { symbol: "USDINR=X", name: "USD/INR", isInr: true },
    { symbol: "EURINR=X", name: "EUR/INR", isInr: true },
    { symbol: "GBPINR=X", name: "GBP/INR", isInr: true },
    { symbol: "JPYINR=X", name: "JPY/INR", isInr: true },

    // Majors
    { symbol: "EURUSD=X", name: "EUR/USD", isInr: false },
    { symbol: "GBPUSD=X", name: "GBP/USD", isInr: false },
    { symbol: "USDJPY=X", name: "USD/JPY", isInr: false },
    { symbol: "AUDUSD=X", name: "AUD/USD", isInr: false },
    { symbol: "USDCHF=X", name: "USD/CHF", isInr: false },
    { symbol: "USDCAD=X", name: "USD/CAD", isInr: false },

    // Commodities
    { symbol: "GC=F", name: "Gold/USD", isInr: false },
    { symbol: "CL=F", name: "Oil/USD", isInr: false },
    { symbol: "BTC-USD", name: "Bitcoin/USD", isInr: false }, // Useful to have
];

export async function GET() {
    try {
        // 1. Try Redis First (Batch Snapshot)
        // Key: "market:snapshot"
        const snapshotRaw = await upstashRedis.get<Record<string, any>>('market:snapshot');

        // Handle Upstash auto-parse or string
        let snapshot = snapshotRaw;
        if (typeof snapshotRaw === 'string') {
            try { snapshot = JSON.parse(snapshotRaw); } catch (e) { }
        }

        const redisResults: any[] = [];
        const missingIndices: number[] = [];

        FOREX_PAIRS.forEach((pair, index) => {
            const data = snapshot && snapshot[pair.symbol];

            if (data && data.price !== undefined) {
                // We have data in the snapshot
                redisResults.push({
                    symbol: pair.symbol,
                    name: pair.name,
                    isInr: pair.isInr,
                    price: data.price,
                    change: data.change || 0,
                    pChange: data.change || 0,
                    // Worker currently doesn't sync bid/ask/high/low to keep cache small.
                    // We can add those to worker later if needed. For now default to price.
                    bid: data.price,
                    ask: data.price,
                    dayHigh: data.price,
                    dayLow: data.price,
                    marketState: "REGULAR"
                });
            } else {
                // Not in snapshot
                missingIndices.push(index);
            }
        });

        // 2. If valid cache exists, return it (Sub-100ms response)
        if (redisResults.length > 0) {
            return NextResponse.json({
                data: redisResults, // We return whatever we have (lazy consistency)
                source: 'redis-batch',
                timestamp: new Date().toISOString()
            });
        }

        // 3. Fallback to Live Fetch (Slow, only on cold start)
        console.log("Forex Redis Cold (snapshot missing). Fetching live...");
        const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

        const results = await Promise.all(
            FOREX_PAIRS.map(async (pair) => {
                try {
                    const quote = await yf.quote(pair.symbol) as any;
                    return {
                        symbol: pair.symbol,
                        name: pair.name,
                        isInr: pair.isInr,
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        pChange: quote.regularMarketChangePercent,
                        bid: quote.bid || quote.regularMarketPrice,
                        ask: quote.ask || quote.regularMarketPrice,
                        dayHigh: quote.regularMarketDayHigh || quote.regularMarketPrice,
                        dayLow: quote.regularMarketDayLow || quote.regularMarketPrice,
                        marketState: quote.marketState
                    };
                } catch (error) {
                    console.error(`Failed to fetch ${pair.symbol}:`, error);
                    return null;
                }
            })
        );

        return NextResponse.json({
            data: results.filter(item => item !== null),
            source: 'yahoo',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch forex data" }, { status: 500 });
    }
}
