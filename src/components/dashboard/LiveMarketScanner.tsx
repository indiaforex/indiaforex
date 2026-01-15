"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Activity, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollIndicator from "@/components/ui/scroll-indicator";

interface ForexData {
    symbol: string;
    name: string;
    isInr: boolean;
    price: number;
    change: number;
    pChange: number;
    bid: number;
    ask: number;
    dayHigh: number;
    dayLow: number;
    marketState: string;
}

export default function LiveMarketScanner() {
    const [data, setData] = useState<ForexData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null); // Ref for scroll container
    // Import useRef from 'react' at the top

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/forex');
            const json = await res.json();
            if (json.data) {
                setData(json.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch forex data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Live polling
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(fetchData, 5000); // 5s poll matched to Market Watch
        return () => clearInterval(interval);
    }, [isLive, fetchData]);

    return (
        <div className="glass-panel border-b border-slate-800 bg-slate-950/50 relative overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
                        Live Market Scanner
                    </h2>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        Forex / Spot
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            Live Feed
                        </span>
                    </div>
                </div>
            </div>

            {/* Matrix View */}
            <div ref={scrollRef} className="px-4 pt-4 pb-1 overflow-x-auto no-scrollbar relative">
                <div className="flex gap-4 min-w-max pb-2">
                    {/* INR PAIRS SECTION - PRIORITY */}
                    <div className="flex gap-2 p-1.5 bg-blue-950/20 border border-blue-500/20 rounded-xl relative group">
                        <div className="absolute -top-2.5 left-3 bg-slate-950 px-2 text-[10px] font-bold text-blue-400 tracking-wider">
                            INR CROSSES
                        </div>
                        {loading && data.length === 0
                            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                            : data.filter(d => d.isInr).map(item => <TickerCard key={item.symbol} item={item} highlight />)
                        }
                    </div>

                    <div className="w-px bg-slate-800 mx-2" />

                    {/* MAJORS SECTION */}
                    <div className="flex gap-2 p-1.5">
                        {loading && data.length === 0
                            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i + 10} />)
                            : data.filter(d => !d.isInr).map(item => <TickerCard key={item.symbol} item={item} />)
                        }
                    </div>
                </div>
            </div>

            {/* Scroll Indicator - Rotated on the Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="-rotate-90 origin-center translate-x-[calc(66%-24px)]">
                    <ScrollIndicator containerRef={scrollRef} orientation="horizontal" className="bg-slate-950/80 px-2 py-1 rounded-full border border-slate-800 shadow-xl" />
                </div>
            </div>

            {/* Footer / Status */}
            <div className="px-4 py-1.5 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Info className="h-3 w-3" />
                    <span>Prices delayed by server cache ~5s</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                    Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                </div>
            </div>
        </div>
    );
}

function TickerCard({ item, highlight }: { item: ForexData; highlight?: boolean }) {
    const isPositive = item.change >= 0;

    return (
        <div className={cn(
            "flex flex-col flex-shrink-0 w-36 p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group hover:shadow-lg",
            highlight
                ? "bg-slate-900/80 border-blue-900/50 hover:border-blue-500/50"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-600"
        )}>
            {/* Background Gradient for INR */}
            {highlight && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-2 relative z-10">
                <span className={cn(
                    "text-xs font-bold tracking-tight",
                    highlight ? "text-slate-100" : "text-slate-400 group-hover:text-slate-200"
                )}>
                    {item.name}
                </span>
                {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                    <TrendingDown className="h-3 w-3 text-rose-500" />
                )}
            </div>

            <div className="mb-2 relative z-10">
                <div className={cn(
                    "text-lg font-mono font-bold tracking-tight",
                    isPositive ? "text-emerald-400" : "text-rose-400"
                )}>
                    {item.price.toFixed(item.isInr ? 2 : 4)}
                </div>
                <div className="flex items-center gap-1.5 opacity-80">
                    <span className={cn(
                        "text-[10px] font-medium px-1.5 rounded",
                        isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                        {item.pChange > 0 ? "+" : ""}{item.pChange.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                        {item.change > 0 ? "+" : ""}{item.change.toFixed(item.isInr ? 2 : 4)}
                    </span>
                </div>
            </div>

            {/* Day Range Bar (Real Data Visualization) */}
            <div className="mt-auto pt-3">
                <div className="flex justify-between text-[8px] text-slate-500 mb-1 font-mono">
                    <span>L: {(item.dayLow || 0).toFixed(2)}</span>
                    <span>H: {(item.dayHigh || 0).toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full relative overflow-hidden">
                    {/* Range Bar Background - Context */}
                    <div className="absolute inset-y-0 left-0 bg-slate-700/30 w-full" />

                    {/* Current Price Marker */}
                    <div
                        className={cn("absolute top-0 bottom-0 w-1 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.5)]", isPositive ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ left: `${((item.price - item.dayLow) / ((item.dayHigh - item.dayLow) || 1)) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="w-36 h-32 rounded-lg bg-slate-900/50 border border-slate-800 animate-pulse" />
    );
}
