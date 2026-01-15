import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const revalidate = 300; // 5 minutes cache

const parser = new Parser();

const FEEDS = [
    "https://www.moneycontrol.com/rss/latestnews.xml",
    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
];

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}

export async function GET() {
    try {
        const feedPromises = FEEDS.map(async (url) => {
            try {
                const feed = await parser.parseURL(url);
                const source = url.includes("moneycontrol") ? "MoneyControl" : "Economic Times";
                return feed.items.slice(0, 5).map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source
                } as NewsItem));
            } catch (err) {
                console.error(`Failed to parse RSS ${url}`, err);
                return [];
            }
        });

        const results = await Promise.all(feedPromises);
        const allNews = results.flat().sort((a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        ).slice(0, 10); // Return top 10 combined news

        return NextResponse.json({ data: allNews });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}
