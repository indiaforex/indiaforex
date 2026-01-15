import { TrendingUp, TrendingDown, Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketOverview() {
    const indices = [
        { name: "NIFTY 50", value: "22,097.45", change: "+85.00", pct: "+0.39%", trend: "up" },
        { name: "BANK NIFTY", value: "48,159.00", change: "+125.50", pct: "+0.26%", trend: "up" },
        { name: "INDIA VIX", value: "15.45", change: "-0.32", pct: "-2.05%", trend: "down" },
        { name: "SENSEX", value: "73,128.80", change: "+350.10", pct: "+0.48%", trend: "up" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {indices.map((idx, i) => (
                <Card key={i} data={idx} />
            ))}
        </div>
    );
}

function Card({ data }: { data: any }) {
    const isUp = data.trend === "up";

    return (
        <div className="glass-panel p-4 rounded-xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className={cn(
                "absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition",
                isUp ? "text-emerald-500" : "text-rose-500"
            )}>
                <Activity className="h-12 w-12" />
            </div>

            <div className="flex justify-between items-start mb-2">
                <h3 className="text-slate-400 text-xs font-semibold tracking-wider">{data.name}</h3>
                <span className={cn(
                    "flex items-center text-xs font-mono px-1.5 py-0.5 rounded",
                    isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                    {data.pct}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white font-mono tracking-tight">{data.value}</span>
                <span className={cn(
                    "text-xs font-mono",
                    isUp ? "text-emerald-500" : "text-rose-500"
                )}>
                    {data.change}
                </span>
            </div>

            {/* Mini Sparkline Simulation */}
            <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full opacity-50", isUp ? "bg-emerald-500" : "bg-rose-500")}
                    style={{ width: `${Math.random() * 40 + 30}%` }}
                ></div>
            </div>
        </div>
    );
}
