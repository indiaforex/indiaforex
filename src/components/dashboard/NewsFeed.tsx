"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNewsFeed } from "@/hooks/useMarketData";
import { Loader2, Rss } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRef } from "react"; // Added useRef
import ScrollIndicator from "@/components/ui/scroll-indicator"; // Added Import

export function NewsFeed() {
    const { news, isLoading } = useNewsFeed();
    const scrollRef = useRef<HTMLDivElement>(null); // Added Ref

    return (
        <Card className="rounded-md border-border/40 shadow-sm h-[50vh] flex flex-col bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex-none p-3 py-2 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Rss className="h-3 w-3 text-muted-foreground" />
                    <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Market Wire</CardTitle>
                </div>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </CardHeader>
            <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-0 min-h-0 no-scrollbar"> {/* Added ref and no-scrollbar */}
                {news.length === 0 && !isLoading ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                        No recent news available.
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {news.map((item, i) => (
                            <a
                                key={i}
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="block p-2.5 hover:bg-muted/30 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-1 py-0.5 rounded-[2px] border border-emerald-500/20 shadow-[0_0_2px_rgba(16,185,129,0.1)]">
                                            {item.source}
                                        </span>
                                        <span className="text-[9px] font-mono text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-200 leading-snug group-hover:text-emerald-400 transition-colors line-clamp-2">
                                    {item.title}
                                </p>
                            </a>
                        ))}
                    </div>
                )}
            </CardContent>
            {/* Fixed Footer */}
            <div className="flex-none p-1.5 border-t border-border/40 bg-muted/20 flex justify-between items-center px-3">
                <span className="text-[10px] text-muted-foreground">Latest NEWS Updates</span>
                <ScrollIndicator containerRef={scrollRef} />
            </div>
        </Card>
    );
}
