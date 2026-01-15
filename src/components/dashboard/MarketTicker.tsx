"use client";

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketData, MarketItem } from '@/hooks/useMarketData';

export default function MarketTicker() {
    const { marketData } = useMarketData();

    // Use default static data while loading or if fallback needed, 
    // but better to just show loading state or empty marqee
    const indices: MarketItem[] = marketData.length > 0 ? marketData : [
        { symbol: "Loading", name: "Loading Market Data...", price: 0, change: 0, pChange: 0, prevClose: 0, isOpen: false }
    ];

    // Duplicate list 3 times for smooth infinite scroll
    const marqueeList = [...indices, ...indices, ...indices, ...indices];

    return (
        <div className="w-full bg-[#020617] border-b border-slate-800 text-slate-300 overflow-hidden relative z-40 h-10 flex items-center shadow-lg">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#020617] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#020617] to-transparent z-10"></div>

            <div className="animate-marquee flex gap-6 whitespace-nowrap px-4 hover:[animation-play-state:paused]">
                {marqueeList.map((idx, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium group cursor-default hover:bg-slate-900/50 py-1 px-2 rounded transition">
                        <span className="text-slate-400 font-semibold">{idx.name}</span>
                        <span className="text-slate-100 font-mono tracking-tight">
                            {idx.symbol === "Loading" ? "" : idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {idx.symbol !== "Loading" && (
                            <span className={cn(
                                "flex items-center gap-0.5 font-mono text-[10px]",
                                idx.pChange >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {idx.pChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {idx.pChange.toFixed(2)}%
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
