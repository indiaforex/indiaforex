import { unstable_cache } from "next/cache";
import yahooFinance from 'yahoo-finance2';

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

export interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    pChange: number;
    prevClose: number;
    isOpen: boolean;
}

async function fetchMarketDataInternal(): Promise<MarketItem[]> {
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
        return results.filter((item): item is MarketItem => item !== null);
    } catch (error) {
        console.error("Market Data Fetch Error:", error);
        return [];
    }
}

// Cached version of the fetch function
// Revalidates every 15 seconds (shared across all users/requests)
export const getMarketData = unstable_cache(
    fetchMarketDataInternal,
    ['market-data-full'],
    {
        revalidate: 15,
        tags: ['market-data']
    }
);
