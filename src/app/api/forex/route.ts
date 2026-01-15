import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// 30 seconds cache to avoid rate limits with many pairs
export const revalidate = 30;

const FOREX_PAIRS = [
    // INR Pairs (Priority)
    { symbol: "INR=X", name: "USD/INR", isInr: true },
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

    // Commodities (often traded with forex)
    { symbol: "GC=F", name: "Gold/USD", isInr: false },
    { symbol: "CL=F", name: "Oil/USD", isInr: false },
];

export async function GET() {
    try {
        const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

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
                        bid: quote.bid || quote.regularMarketPrice, // Forex usually has bid/ask
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

        const data = results.filter(item => item !== null);

        return NextResponse.json({ data, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch forex data" }, { status: 500 });
    }
}
