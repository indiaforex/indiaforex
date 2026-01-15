import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// 15 seconds cache - balances freshness with source load
export const revalidate = 15;

const SYMBOLS = [
    "^NSEI",    // NIFTY 50
    "^NSEBANK", // BANK NIFTY
    "^BSESN",   // SENSEX
    "INR=X",    // USD/INR
    "^GSPC",    // S&P 500
    "BTC-USD",  // BITCOIN
    "GC=F",     // GOLD
    "CL=F",     // CRUDE OIL
    // Top Constituents for Heatmap
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LICI.NS", "LT.NS"
];

// Helper to map Yahoo symbols to our display names
const NAME_MAP: Record<string, string> = {
    "^NSEI": "NIFTY 50",
    "^NSEBANK": "BANK NIFTY",
    "^BSESN": "SENSEX",
    "INR=X": "USD/INR",
    "^GSPC": "S&P 500",
    "BTC-USD": "BITCOIN",
    "GC=F": "GOLD",
    "CL=F": "CRUDE OIL",
    "RELIANCE.NS": "Reliance",
    "TCS.NS": "TCS",
    "HDFCBANK.NS": "HDFC Bank",
    "INFY.NS": "Infosys",
    "ICICIBANK.NS": "ICICI Bank",
    "SBIN.NS": "SBI",
    "BHARTIARTL.NS": "Airtel",
    "ITC.NS": "ITC",
    "LICI.NS": "LIC India",
    "LT.NS": "L&T"
};

export async function GET() {
    try {
        const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

        const results = await Promise.all(
            SYMBOLS.map(async (symbol) => {
                try {
                    const quote = await yf.quote(symbol) as any;
                    return {
                        symbol,
                        name: NAME_MAP[symbol] || symbol,
                        price: quote.regularMarketPrice,
                        change: quote.regularMarketChange,
                        pChange: quote.regularMarketChangePercent,
                        prevClose: quote.regularMarketPreviousClose,
                        isOpen: quote.marketState === "REGULAR" || quote.marketState === "OPEN"
                    };
                } catch (error) {
                    console.error(`Failed to fetch ${symbol}:`, error);
                    return null;
                }
            })
        );

        // Filter out failed fetches
        const data = results.filter(item => item !== null);

        return NextResponse.json({ data, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
    }
}
