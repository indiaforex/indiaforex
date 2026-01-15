"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useMarketData } from "@/hooks/useMarketData";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const CustomizeContent = (props: any) => {
    const { depth, x, y, width, height, name, change, isMini } = props;

    // We only want to render the LEAF nodes (Stock Tickers), which are depth 2
    // Root is 0, Category is 1, Stock is 2
    if (depth !== 2) return null;

    // Color Logic: Brighter, more readable
    const isPositive = change >= 0;
    // Scale opacity: Base 0.50 (more visible) to Max 0.95 (very clear)
    const opacity = 0.50 + Math.min(Math.abs(change) / 4, 0.45);

    // Using brighter/vibrant base colors (Emerald 600 / Rose 600) 
    const fill = isPositive
        ? `rgba(5, 150, 105, ${opacity})` // Emerald 600
        : `rgba(225, 29, 72, ${opacity})`; // Rose 600

    return (
        <g>
            {/* Main Box */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fill,
                    stroke: '#020617', // Background color to create a "Gap"
                    strokeWidth: 3,    // Clean 3px separation/gap
                    rx: 6,             // Maintains the soft rounded look
                    ry: 6,
                }}
            />

            {/* Ticker Name */}
            {width > 40 && height > 20 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 4}
                    textAnchor="middle"
                    fill="#ffffff"      // Pure white for maximum contrast
                    stroke="none"       // Explicitly remove text outline
                    fontSize={Math.min(width / 6, 11)}
                    fontWeight={600}
                    className="pointer-events-none select-none drop-shadow-sm" // Substle shadow for readability
                >
                    {name}
                </text>
            )}

            {/* % Change */}
            {width > 40 && height > 35 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 10}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    stroke="none"       // Explicitly remove text outline
                    fontSize={Math.min(width / 7, 10)}
                    className="pointer-events-none select-none font-mono drop-shadow-sm"
                >
                    {isPositive ? "+" : ""}{change?.toFixed(2)}%
                </text>
            )}
        </g>
    );
};

export default function SectorHeatmap() {
    const { marketData, isLoading } = useMarketData();

    const processData = () => {
        if (!marketData.length) return [];

        const find = (sym: string) => marketData.find(m => m.symbol === sym);

        const get = (sym: string, fallbackName: string) => {
            const item = find(sym);
            if (!item) return { name: fallbackName, size: 1, change: 0 };
            return { name: item.name, size: Math.abs(item.pChange) + 1, change: item.pChange };
        };

        return [
            {
                name: 'Financials',
                children: [
                    get('HDFCBANK.NS', 'HDFC Bank'),
                    get('ICICIBANK.NS', 'ICICI Bank'),
                    get('SBIN.NS', 'SBI'),
                    get('LICI.NS', 'LIC'),
                ]
            },
            {
                name: 'Technology',
                children: [
                    get('TCS.NS', 'TCS'),
                    get('INFY.NS', 'Infosys'),
                ]
            },
            {
                name: 'Energy/Infra',
                children: [
                    get('RELIANCE.NS', 'Reliance'),
                    get('LT.NS', 'L&T'),
                    get('BHARTIARTL.NS', 'Airtel'),
                ]
            },
            {
                name: 'Consumer',
                children: [
                    get('ITC.NS', 'ITC'),
                ]
            },
        ];
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const data = processData();

    return (
        <>
            {/* Sidebar Widget (Clickable) */}
            <Card
                className="rounded-md border-border/40 shadow-sm h-[160px] flex flex-col bg-card/50 backdrop-blur-sm cursor-pointer hover:border-emerald-500/50 transition-colors group mt-4 relative overflow-hidden"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                    </div>
                </div>
                <CardHeader className="flex-none p-3 py-2 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sector Heatmap
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 min-h-0 bg-slate-950/50">
                    {isLoading && marketData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                        </div>
                    ) : (
                        <div className="w-full h-full p-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <MiniChart data={data} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Full Screen Modal - Portaled to Body to escape Sidebar Z-Index Stacking Context */}
            {isModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-3 py-2 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <div>
                                    <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Market Sector Heatmap</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 p-4 bg-slate-950">
                            <FullChart data={data} />
                        </div>
                        <div className="p-3 bg-slate-900/50 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
                            <span>Size indicates market cap weight</span>
                            <span>Color intensity indicates % change magnitude</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

// Extracted Components to prevent re-renders wiping state
const MiniChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
        <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#020617"
            fill="#8884d8"
            content={<CustomizeContent isMini={true} />}
            isAnimationActive={false}
        />
    </ResponsiveContainer>
);

const FullChart = ({ data }: { data: any[] }) => {
    const [animate, setAnimate] = useState(true);

    useEffect(() => {
        // Disable animation after first render
        const timer = setTimeout(() => setAnimate(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <Treemap
                data={data}
                dataKey="size"
                aspectRatio={16 / 9}
                stroke="#020617"
                content={<CustomizeContent isMini={false} />}
                animationDuration={800}
                isAnimationActive={animate}
            >
                <Tooltip
                    content={({ payload }) => {
                        if (payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-slate-900 border border-slate-700 p-2.5 rounded shadow-xl z-50">
                                    <p className="text-xs font-bold text-slate-100">{data.name}</p>
                                    <p className={cn(
                                        "text-xs font-mono",
                                        data.change > 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {data.change > 0 ? "+" : ""}{data.change?.toFixed(2)}%
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
            </Treemap>
        </ResponsiveContainer>
    );
};
