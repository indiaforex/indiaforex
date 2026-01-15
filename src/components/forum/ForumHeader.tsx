"use client";

import Link from 'next/link';
import { BarChart3, Bell } from 'lucide-react';
import { UserNav } from '@/components/auth/UserNav';
import { motion } from 'framer-motion';
import { useMarketData } from '@/hooks/useMarketData';

export default function ForumHeader() {
    const { marketData } = useMarketData();

    // Format market data for the ticker
    // If no data yet, use some placeholders or loading state, but mapped headlines is better
    const tickerItems = marketData.length > 0
        ? marketData
        : [
            { symbol: 'SENSEX', name: 'SENSEX', price: 73128.80, pChange: 0.5 },
            { symbol: 'NIFTY', name: 'NIFTY 50', price: 22150.40, pChange: 0.6 },
            { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 46500.20, pChange: -0.2 },
            { symbol: 'USDINR', name: 'USD/INR', price: 83.15, pChange: 0.05 },
        ];

    return (
        <header className="glass-header sticky top-0 z-50 w-full h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
            <div className="w-full h-full flex items-center justify-between px-4 lg:px-8 gap-6">
                {/* Left: Standard Logo */}
                <Link href="/" className="flex items-center gap-3 group flex-none">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-slate-900 border border-slate-700/50 p-1.5 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight text-slate-100 leading-none">
                            India<span className="text-blue-500">Forex</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                            Institutional Terminal
                        </span>
                    </div>
                </Link>

                {/* Center: Infinite Marquee Ticker */}
                <div className="flex-1 overflow-hidden relative h-full flex items-center mask-linear-fade border-l border-r border-slate-800/50 mx-4 bg-slate-950/30">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950/80 to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950/80 to-transparent z-10"></div>

                    <div className="flex w-full overflow-hidden select-none gap-12">
                        <motion.div
                            className="flex items-center gap-12 whitespace-nowrap shrink-0"
                            animate={{ x: "-100%" }}
                            transition={{
                                repeat: Infinity,
                                ease: "linear",
                                duration: 40,
                            }}
                        >
                            {tickerItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 group cursor-pointer">
                                    <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                                        {item.name}
                                    </span>
                                    <span className={`font-mono text-xs ${item.pChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {item.price.toFixed(2)}
                                    </span>
                                    <span className={`text-[10px] px-1 py-0.5 rounded ${item.pChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {item.pChange > 0 ? '+' : ''}{item.pChange.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                        <motion.div
                            className="flex items-center gap-12 whitespace-nowrap shrink-0"
                            animate={{ x: "-100%" }}
                            transition={{
                                repeat: Infinity,
                                ease: "linear",
                                duration: 40,
                            }}
                        >
                            {tickerItems.map((item, i) => (
                                <div key={`clone-${i}`} className="flex items-center gap-2 group cursor-pointer">
                                    <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                                        {item.name}
                                    </span>
                                    <span className={`font-mono text-xs ${item.pChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {item.price.toFixed(2)}
                                    </span>
                                    <span className={`text-[10px] px-1 py-0.5 rounded ${item.pChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {item.pChange > 0 ? '+' : ''}{item.pChange.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4 flex-none">
                    <button className="text-slate-400 hover:text-white transition relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                    </button>

                    <div className="h-8 w-px bg-slate-800"></div>

                    <UserNav />
                </div>
            </div>
        </header>
    );
}
