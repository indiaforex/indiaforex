"use client";

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { UserNav } from '@/components/auth/UserNav';
import { motion } from 'framer-motion';
import { useMarketData } from '@/hooks/useMarketData';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Header() {
    const { marketData } = useMarketData();
    const pathname = usePathname();
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    useEffect(() => {
        const checkMarketStatus = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (3600000 * 5.5)); // IST is UTC+5.5

            const day = ist.getDay();
            const hour = ist.getHours();
            const minute = ist.getMinutes();
            const time = hour * 60 + minute;

            // NSE Market Hours: 09:15 to 15:30
            const isOpen = day >= 1 && day <= 5 && time >= 555 && time <= 930;
            setIsMarketOpen(isOpen);
        };

        checkMarketStatus();
        const interval = setInterval(checkMarketStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const navLinks = [
        { name: 'Market Board', href: '/' },
        { name: 'Forum', href: '/forum' }
    ];

    const isThreadPage = pathname?.startsWith('/forum') && pathname !== '/forum';

    // Format market data for the ticker
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
            <div className="w-full h-full flex items-center justify-between px-4 lg:px-8">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-6 flex-none">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                            <div className="relative bg-slate-900 border border-slate-700/50 p-1.5 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex flex-col hidden sm:flex">
                            <span className="font-bold text-lg tracking-tight text-slate-100 leading-none">
                                India<span className="text-blue-500">Forex</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                                Institutional Terminal
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1 ml-6">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            if (isActive) {
                                return (
                                    <span key={link.href} className="px-3 py-1.5 text-sm font-bold text-white cursor-default">
                                        {link.name}
                                    </span>
                                );
                            }
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition"
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Center: Infinite Marquee Ticker (Flexible Width) */}
                {!isThreadPage && (
                    <div className="flex-1 overflow-hidden relative h-full flex items-center mask-linear-fade border-l border-r border-slate-800/50 mx-4 bg-slate-950/30 hidden md:flex">
                        {/* Gradient Masks */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950/80 to-transparent z-10"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950/80 to-transparent z-10"></div>

                        <div className="flex w-full overflow-hidden select-none gap-8">
                            <motion.div
                                className="flex items-center gap-8 whitespace-nowrap shrink-0"
                                animate={{ x: "-100%" }}
                                transition={{
                                    repeat: Infinity,
                                    ease: "linear",
                                    duration: 30,
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
                                className="flex items-center gap-8 whitespace-nowrap shrink-0"
                                animate={{ x: "-100%" }}
                                transition={{
                                    repeat: Infinity,
                                    ease: "linear",
                                    duration: 30,
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
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-4 flex-none">
                    <div className={cn(
                        "hidden xl:flex items-center border rounded-full px-3 py-1.5 transition-colors",
                        isMarketOpen
                            ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-900/50 border-slate-700/50 text-slate-400"
                    )}>
                        <div className={cn(
                            "h-2 w-2 rounded-full mr-2",
                            isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                        )}></div>
                        <span className="text-xs font-mono">
                            {isMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

                    <NotificationBell />

                    <UserNav />
                </div>
            </div>
        </header>
    );
}
