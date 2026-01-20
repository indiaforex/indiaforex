"use client";

import Link from 'next/link';
import { BarChart3, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { UserNav } from '@/components/auth/UserNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';

import { usePathname } from 'next/navigation';

export default function Header() {
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const checkMarketStatus = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (3600000 * 5.5)); // IST is UTC+5.5

            const day = ist.getDay();
            const hour = ist.getHours();
            const minute = ist.getMinutes();
            const time = hour * 60 + minute;

            // NSE Market Hours: 09:15 to 15:30, Mon-Fri (1-5)
            // 09:15 = 9*60 + 15 = 555
            // 15:30 = 15*60 + 30 = 930
            const isOpen = day >= 1 && day <= 5 && time >= 555 && time <= 930;
            setIsMarketOpen(isOpen);
        };

        checkMarketStatus();
        const interval = setInterval(checkMarketStatus, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const navLinks = [
        { name: 'Market Board', href: '/' },
        { name: 'Forum', href: '/forum' }
    ];

    return (
        <header className="glass-header sticky top-0 z-50 w-full h-16">
            <div className="w-full h-full flex items-center justify-between px-4 lg:px-8">
                {/* Left: Logo & Mobile Menu */}
                <div className="flex items-center gap-6">
                    <div className="lg:hidden text-slate-400 hover:text-white cursor-pointer transition">
                        <Menu className="h-6 w-6" />
                    </div>

                    <Link href="/" className="flex items-center gap-3 group">
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

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "hidden md:flex items-center border rounded-full px-3 py-1.5 transition-colors",
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
