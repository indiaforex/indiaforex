"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EconomicEvent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, BarChart2 } from "lucide-react";

export const columns: ColumnDef<EconomicEvent>[] = [
    {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.getValue("time")}</div>,
    },
    {
        accessorKey: "impact",
        header: () => <div className="text-center">Imp</div>,
        cell: ({ row }) => {
            const impact = row.getValue("impact") as string;
            const colors: Record<string, string> = {
                High: "bg-red-500",
                Medium: "bg-orange-500",
                Low: "bg-yellow-500",
            };
            return (
                <div className="flex justify-center">
                    <div
                        className={cn("h-3 w-1.5 rounded-sm", colors[impact] || "bg-slate-500")}
                        title={impact}
                    />
                </div>
            );
        },
    },
    {
        accessorKey: "event",
        header: "Event",
        cell: ({ row }) => (
            <div className="font-medium text-xs md:text-sm text-foreground/90 truncate max-w-[180px] md:max-w-xs cursor-pointer hover:text-primary transition-colors">
                {row.getValue("event")}
            </div>
        ),
    },
    {
        accessorKey: "actual",
        header: () => <div className="text-right">Actual</div>,
        cell: ({ row }) => {
            const actual = row.getValue("actual") as string;
            const forecast = row.original.forecast;

            let colorClass = "text-foreground";
            if (actual !== "---" && forecast) {
                const actVal = parseFloat(actual.replace(/[^0-9.-]/g, ''));
                const fctVal = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
                if (!isNaN(actVal) && !isNaN(fctVal)) {
                    if (actVal > fctVal) colorClass = "text-emerald-500 font-bold";
                    if (actVal < fctVal) colorClass = "text-rose-500 font-bold";
                }
            }

            return <div className={cn("text-right font-mono text-xs", colorClass)}>{actual}</div>;
        },
    },
    {
        accessorKey: "forecast",
        header: () => <div className="text-right">Forecast</div>,
        cell: ({ row }) => <div className="text-right font-mono text-xs text-muted-foreground">{row.getValue("forecast")}</div>,
    },
    {
        accessorKey: "previous",
        header: () => <div className="text-right">Previous</div>,
        cell: ({ row }) => <div className="text-right font-mono text-xs text-muted-foreground">{row.getValue("previous")}</div>,
    },
    {
        id: "chart",
        cell: () => (
            <div className="flex justify-end">
                <BarChart2 className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100 cursor-pointer" />
            </div>
        )
    }
];
