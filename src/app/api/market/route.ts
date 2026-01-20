import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/market';

// We rely on unstable_cache in getMarketData, but validatine the route itself is also fine.
// Set to 0 to ensure we always hit the cache function (which handles its own expiry).
export const revalidate = 0;

export async function GET() {
    try {
        const data = await getMarketData();
        return NextResponse.json({ data, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
    }
}
