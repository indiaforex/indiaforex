import { EconomicEvent } from "./types";

const SHEET_URL = process.env.NEXT_PUBLIC_SHEETDB_URL;

export async function getEvents(): Promise<EconomicEvent[]> {
    if (!SHEET_URL) {
        console.error("SHEETDB_URL is missing in environment variables.");
        return [];
    }

    try {
        // Fetching without ?sheet=Name defaults to the first tab, which works for the user.
        // Using ISR (1 minute cache) to prevent build errors and rate limiting
        const res = await fetch(SHEET_URL, {
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            console.error("SheetDB Fetch Failed:", res.statusText);
            return [];
        }

        const data = await res.json();

        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.error("SheetDB returned non-array:", data);
            return [];
        }

        return data;
    } catch (err) {
        console.error("SheetDB Logic Error:", err);
        return [];
    }
}

export async function addEvent(event: Omit<EconomicEvent, 'id'>) {
    if (!SHEET_URL) throw new Error("SheetDB URL missing");

    const newEvent = {
        ...event,
        id: Date.now().toString(),
        // SheetDB/Google Sheets needs arrays to be stringified to fit in a single cell
        history: event.history ? JSON.stringify(event.history) : '[]',
        stories: event.stories ? JSON.stringify(event.stories) : '[]'
    };

    const res = await fetch(SHEET_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: newEvent }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("SheetDB Write Failed:", res.status, text);
        throw new Error(`SheetDB Error: ${text}`);
    }
}
