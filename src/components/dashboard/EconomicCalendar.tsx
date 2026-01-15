"use client";

import { EconomicEvent, ImpactLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, ChevronDown, Filter, FileText, ExternalLink, X, FolderOpen } from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollIndicator from "@/components/ui/scroll-indicator";

// ... (helpers) ...

const safeParse = (data: any) => {
    if (!data) return [];
    try {
        if (typeof data === 'string') {
            const cleanData = data.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
            return JSON.parse(cleanData);
        }
        return data;
    } catch (e) {
        return [];
    }
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const displayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function EconomicCalendar({ data }: { data: EconomicEvent[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
    const scrollRef = useRef<HTMLDivElement>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(current => current === id ? null : id);
    };

    const changeDate = (days: number) => {
        // ... (change date logic)
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(formatDate(d));
        setExpandedId(null);
    };

    const jumpToToday = () => {
        // ... (jump logic)
        setSelectedDate(formatDate(new Date()));
        setExpandedId(null);
    };

    const filteredData = data.filter(item => {
        if (!item.date) return true;
        return item.date === selectedDate;
    });

    if (!data?.length) return (
        <div className="glass-panel p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 mb-4">
                <Clock className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-medium">No sessions scheduled</h3>
            <p className="text-slate-500 text-sm mt-1">Check back later for market updates.</p>
        </div>
    );

    return (
        <div className="glass-panel rounded-xl border border-slate-800 shadow-2xl select-none selection:bg-transparent flex flex-col">
            {/* Toolbar - Compact Header */}
            <div className="flex-none flex items-center justify-between p-3 py-2 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-3">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5 border border-border/40">
                        <button onClick={() => changeDate(-1)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition">
                            <ChevronDown className="h-3 w-3 rotate-90" />
                        </button>
                        <span className="text-[11px] font-bold text-foreground px-2 min-w-[80px] text-center select-none">
                            {displayDate(selectedDate)}
                        </span>
                        <button onClick={() => changeDate(1)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition">
                            <ChevronDown className="h-3 w-3 -rotate-90" />
                        </button>
                    </div>

                    {/* Today / Live Indicator */}
                    {selectedDate === formatDate(new Date()) ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Today</span>
                        </div>
                    ) : (
                        <button onClick={jumpToToday} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition">
                            Go to Today
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground bg-background/50 hover:bg-muted rounded transition border border-border/40">
                        <Filter className="h-3 w-3" /> Filter
                    </button>
                </div>
            </div>

            {/* Grid Header - Static */}
            <div className="flex-none grid grid-cols-12 gap-2 bg-slate-900/95 backdrop-blur border-b border-slate-800 py-3 px-4 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-500 items-center select-none shadow-sm">
                {/* First 3 Cols: Uniform Widths */}
                <div className="col-span-1 text-left pl-2">Time</div>
                <div className="col-span-1 text-center hidden sm:block">Cur</div>
                <div className="col-span-1 text-center">Imp</div>

                {/* Event: 4 Cols (Reduced from 5) */}
                <div className="col-span-4 pl-2">Event</div>

                {/* Data: 5 Cols (Increased from 4) */}
                <div className="col-span-5 grid grid-cols-3 text-right">
                    <span className="hidden sm:block">Actual</span>
                    <span className="hidden sm:block">Fcst</span>
                    <span className="hidden sm:block">Prev</span>
                    <span className="sm:hidden col-span-3 text-right">Data</span>
                </div>
            </div>

            {/* Grid Body - Auto Height (No Scroll Container) */}
            <div className="flex-1 min-h-0 divide-y divide-slate-800/50">
                {filteredData.length > 0 ? (
                    filteredData.map((item, i) => {
                        const rowId = item.id || i.toString();
                        const isExpanded = expandedId === rowId;
                        const history = safeParse(item.history);
                        const stories = safeParse(item.stories);

                        return (
                            <div key={rowId} className="group transition-colors duration-200 hover:bg-slate-800/30">
                                {/* Main Row (Clickable) */}
                                <div
                                    onClick={() => toggleExpand(rowId)}
                                    className="grid grid-cols-12 gap-2 py-3 px-4 items-center cursor-pointer select-none"
                                >
                                    {/* Time - Uniform Col 1 */}
                                    <div className="col-span-1 text-xs font-mono text-slate-400 group-hover:text-slate-200 text-left pl-2">
                                        {item.time}
                                    </div>

                                    {/* Currency - Uniform Col 2 */}
                                    <div className="hidden sm:block col-span-1 text-center text-xs font-mono text-slate-500 font-bold">
                                        {item.currency || "USD"}
                                    </div>

                                    {/* Impact - Uniform Col 3 */}
                                    <div className="col-span-1 flex justify-center">
                                        <ImpactBadge impact={item.impact} />
                                    </div>

                                    {/* Event Name - 4 Cols */}
                                    <div className="col-span-4 w-full pl-2">
                                        <span className={cn(
                                            "font-medium text-sm transition truncate block",
                                            isExpanded ? "text-white" : "text-slate-300 group-hover:text-white"
                                        )}>
                                            {item.event}
                                        </span>
                                    </div>

                                    {/* Data Columns - 5 Cols (Wider) */}
                                    <div className="col-span-5 grid grid-cols-3 text-right font-mono text-xs items-center">
                                        <DataValue value={item.actual} forecast={item.forecast} isActual />
                                        <span className="hidden sm:block text-slate-500">{item.forecast}</span>
                                        <span className="hidden sm:block text-slate-500">{item.previous}</span>
                                    </div>
                                </div>

                                {/* Detailed View Panel */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden bg-slate-950/30 border-t border-slate-800/50 shadow-inner"
                                        >
                                            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
                                                {/* Details Content (Same as before) */}
                                                <div className="space-y-4">
                                                    <div className="bg-slate-800/40 rounded border border-slate-700/50 overflow-hidden">
                                                        <div className="bg-slate-800/60 px-3 py-1.5 border-b border-slate-700/50 flex justify-between items-center">
                                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Specs</span>
                                                            <span className="text-[10px] text-slate-500">Src: {item.source || "N/A"}</span>
                                                        </div>
                                                        <div className="p-3 space-y-3">
                                                            <div>
                                                                <div className="text-xs text-slate-500 font-medium mb-1">Description</div>
                                                                <div className="text-slate-300 leading-relaxed text-xs">{item.description || "No description provided."}</div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <div className="text-[10px] text-slate-500 uppercase">Frequency</div>
                                                                    <div className="text-slate-300 font-medium">{item.frequency || "-"}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] text-slate-500 uppercase">Next Release</div>
                                                                    <div className="text-slate-300 font-medium">{item.nextRelease || "-"}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-800/40 rounded border border-slate-700/50 overflow-hidden h-fit">
                                                    <div className="bg-slate-800/60 px-3 py-1.5 border-b border-slate-700/50">
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent History</span>
                                                    </div>
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-[#1e293b]/50 text-slate-500 border-b border-slate-700/50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-medium">Date</th>
                                                                <th className="px-3 py-2 text-right font-medium">Act</th>
                                                                <th className="px-3 py-2 text-right font-medium">Fcst</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-700/30">
                                                            {Array.isArray(history) && history.length > 0 ? (
                                                                history.map((h: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-slate-700/20">
                                                                        <td className="px-3 py-2 text-sky-400 font-medium whitespace-nowrap">{h.date}</td>
                                                                        <td className="px-3 py-2 text-right text-slate-300 font-mono">{h.actual}</td>
                                                                        <td className="px-3 py-2 text-right text-slate-400 font-mono">{h.forecast}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} className="p-4 text-center text-slate-500 italic">No history data</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="bg-slate-800/40 rounded border border-slate-700/50 overflow-hidden h-fit">
                                                    <div className="bg-slate-800/60 px-3 py-1.5 border-b border-slate-700/50">
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Related Stories</span>
                                                    </div>
                                                    <div className="divide-y divide-slate-700/30">
                                                        {Array.isArray(stories) && stories.length > 0 ? (
                                                            stories.map((story: any, idx: number) => (
                                                                <a
                                                                    key={idx}
                                                                    href={story.link || "#"}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block p-3 hover:bg-slate-700/20 group cursor-pointer transition"
                                                                >
                                                                    <div className="flex gap-1.5 items-center mb-1">
                                                                        <span className="text-[10px] text-amber-500 font-bold px-1 bg-amber-500/10 rounded">NEWS</span>
                                                                        <span className="text-[10px] text-slate-500">{story.time}</span>
                                                                    </div>
                                                                    <h4 className="text-xs text-slate-300 font-medium leading-normal group-hover:text-emerald-400 transition-colors line-clamp-2">
                                                                        {story.title}
                                                                    </h4>
                                                                </a>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-slate-500 italic">No related stories</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center glass-panel">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/50 mb-3">
                            <Clock className="h-5 w-5 text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">No events for {displayDate(selectedDate)}</p>
                        <p className="text-slate-600 text-xs mt-1">Try another date or check filters.</p>
                        <button onClick={jumpToToday} className="text-emerald-500 text-xs mt-3 hover:underline">Return to Today</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ... subcomponents match existing

// Sub-components for cleaner code
function ImpactBadge({ impact }: { impact: ImpactLevel }) {
    const colors = {
        High: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
        Medium: "bg-amber-500",
        Low: "bg-emerald-500",
    };
    return (
        <div title={`${impact} Impact`} className={cn("w-1.5 h-4 rounded-full", colors[impact])}></div>
    );
}

function DataValue({ value, forecast, isActual }: { value: string; forecast?: string; isActual?: boolean }) {
    const isPositive = isActual && value && forecast && parseFloat(value) > parseFloat(forecast);
    const isNegative = isActual && value && forecast && parseFloat(value) < parseFloat(forecast);

    return (
        <span className={cn(
            "font-bold",
            value === '---' || !value ? "text-slate-600" : "text-slate-200",
            isPositive && "text-emerald-400",
            isNegative && "text-rose-400"
        )}>
            {value || "---"}
        </span>
    );
}
