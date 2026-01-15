"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export default function TradersOnline() {
    const [count, setCount] = useState(2431);
    const [trend, setTrend] = useState<"up" | "down" | "neutral">("neutral");

    useEffect(() => {
        // Initial random fluctuation
        const interval = setInterval(() => {
            setCount(prev => {
                const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
                const newCount = prev + change;
                setTrend(change > 0 ? "up" : change < 0 ? "down" : "neutral");
                return newCount;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel rounded-xl border border-slate-800 shadow-lg p-4 relative overflow-hidden group">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50"></div>

            <div className="relative z-10 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Traders Online</h3>
                    </div>

                    {/* Pulsing Dot */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Live</span>
                    </div>
                </div>

                {/* Counter */}
                <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-mono font-bold text-white tracking-tight animate-in fade-in">
                        {count.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-medium mb-1.5 transition-colors ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-500"
                        }`}>
                        {trend === "up" ? "▲" : trend === "down" ? "▼" : "•"}
                    </span>
                </div>

                <p className="text-[10px] text-slate-500 font-medium">Active on platform</p>
            </div>
        </div>
    );
}
