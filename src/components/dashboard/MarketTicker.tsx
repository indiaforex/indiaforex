"use client";

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketData, MarketItem } from '@/hooks/useMarketData';

export default function MarketTicker() {
    const { marketData } = useMarketData();

    // Use default static data while loading or if fallback needed, 
    // but better to just show loading state or empty marqee
    const indices: MarketItem[] = marketData.length > 0 ? marketData : [
        { symbol: "SENSEX", name: "SENSEX", price: 73128.80, change: 0, pChange: 0.52, prevClose: 0, isOpen: true },
        { symbol: "NIFTY", name: "NIFTY 50", price: 22150.40, change: 0, pChange: 0.63, prevClose: 0, isOpen: true },
        { symbol: "BANKNIFTY", name: "BANK NIFTY", price: 46500.20, change: 0, pChange: -0.21, prevClose: 0, isOpen: true },
        { symbol: "USDINR", name: "USD/INR", price: 83.15, change: 0, pChange: 0.05, prevClose: 0, isOpen: true },
    ];

    // Ensure we have enough items to fill width
    const items = [...indices, ...indices, ...indices];

    return (
        <div className="w-full bg-[#020617] border-b border-slate-800 text-slate-300 overflow-hidden relative z-40 h-10 flex items-center shadow-lg">
            {/* Gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#020617] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#020617] to-transparent z-10"></div>

            {/* Scrolling Container 1 */}
            <div className="animate-marquee flex gap-12 whitespace-nowrap px-4 shrink-0 min-w-full items-center">
                {items.map((idx, i) => (
                    <div key={`${i}-1`} className="flex items-center gap-2 text-xs font-medium cursor-default">
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
                                {Math.abs(idx.pChange).toFixed(2)}%
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Scrolling Container 2 (Clone) */}
            <div className="animate-marquee flex gap-12 whitespace-nowrap px-4 shrink-0 min-w-full items-center" aria-hidden="true">
                {items.map((idx, i) => (
                    <div key={`${i}-2`} className="flex items-center gap-2 text-xs font-medium cursor-default">
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
                                {Math.abs(idx.pChange).toFixed(2)}%
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
