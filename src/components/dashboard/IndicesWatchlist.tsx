"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useMarketData } from "@/hooks/useMarketData";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ScrollIndicator from "@/components/ui/scroll-indicator";

export function IndicesWatchlist() {
    const { marketData, isLoading, mutate } = useMarketData();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // ... (rest of the component logic)

    // Fix Hydration: Set initial time only on client
    useEffect(() => {
        setLastUpdated(new Date().toLocaleTimeString());
    }, []);

    // Update timestamp when data changes (fresh fetch)
    useEffect(() => {
        if (!isLoading && marketData.length > 0) {
            setLastUpdated(new Date().toLocaleTimeString());
        }
    }, [marketData, isLoading]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Enforce a minimum spin time for UX so user feels the "click"
        const minSpin = new Promise(resolve => setTimeout(resolve, 600));
        await Promise.all([mutate(), minSpin]);
        setIsRefreshing(false);
    };

    // Fallback static data if loading initially or valid mock needed
    const displayData = marketData.length > 0 ? marketData : [];

    return (
        <Card className="rounded-md border-border/40 shadow-sm flex-1 min-h-[40vh] flex flex-col bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex-none p-3 py-2 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Market Watch</CardTitle>
                <div className="flex items-center gap-2">
                    {/* Show loader only on initial load, not revalidations */}
                    {isLoading && !displayData.length && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    <Activity className="h-3 w-3 text-slate-600 animate-pulse" />
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5 active:scale-95 disabled:opacity-50"
                        title="Force Refresh"
                    >
                        <RefreshCw className={cn("h-3 w-3", (isRefreshing || isLoading) ? "animate-spin" : "")} />
                    </button>
                </div>
            </CardHeader>
            <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-0 min-h-0 no-scrollbar">
                <Table className="table-fixed w-full">
                    <TableBody>
                        {displayData.map((item) => (
                            <TableRow key={item.symbol} className="hover:bg-muted/50 transition-colors border-b border-border/40">
                                <TableCell className="font-semibold text-[11px] py-1.5 px-3 whitespace-nowrap truncate w-[40%] text-slate-300" title={item.name}>
                                    {item.name}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right text-[11px] font-mono tracking-tight py-1.5 px-1 whitespace-nowrap w-[30%]",
                                    item.pChange > 0 ? "text-emerald-400" : item.pChange < 0 ? "text-rose-400" : "text-muted-foreground"
                                )}>
                                    {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right text-[11px] font-mono tracking-tight py-1.5 px-3 whitespace-nowrap w-[30%]",
                                    item.pChange > 0 ? "text-emerald-400" : item.pChange < 0 ? "text-rose-400" : "text-muted-foreground"
                                )}>
                                    {item.pChange > 0 ? "+" : ""}{item.pChange.toFixed(2)}%
                                </TableCell>
                            </TableRow>
                        ))}
                        {displayData.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">
                                    Market Closed / No Data
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {/* Fixed Footer with Scroll Indicator */}
            <div className="flex-none p-1.5 border-t border-border/40 bg-muted/20 flex justify-between items-center px-3">
                <span className="text-[10px] text-muted-foreground">
                    {lastUpdated ? `Updated: ${lastUpdated}` : "Connecting..."}
                </span>
                <ScrollIndicator containerRef={scrollRef} />
            </div>
        </Card>
    );
}
