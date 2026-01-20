import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    pChange: number;
    prevClose: number;
    isOpen: boolean;
}

export function useMarketData(initialData?: MarketItem[]) {
    const { data, error, isLoading, mutate } = useSWR<{ data: MarketItem[] }>('/api/market', fetcher, {
        refreshInterval: 15000, // Poll every 15 seconds (synced with cache)
        revalidateOnFocus: false,
        keepPreviousData: true, // Prevents flashing loading state between updates
        fallbackData: initialData ? { data: initialData } : undefined
    });

    return {
        marketData: data?.data || [],
        isLoading,
        isError: error,
        mutate // Expose mutate for manual refresh
    };
}

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}

export function useNewsFeed() {
    const { data, error, isLoading } = useSWR<{ data: NewsItem[] }>('/api/news', fetcher, {
        refreshInterval: 300000,
        revalidateOnFocus: false
    });

    return {
        news: data?.data || [],
        isLoading,
        isError: error
    };
}
