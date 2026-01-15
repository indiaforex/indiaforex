"use client";

import { EconomicEvent } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProCalendar({ data }: { data: EconomicEvent[] }) {
    return (
        <Card className="rounded-md border-border/40 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <CardHeader className="p-4 py-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold tracking-tight">Economic Calendar</CardTitle>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-background border-border/40">
                        <Filter className="h-3 w-3" /> Filter
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <DataTable columns={columns} data={data} />
            </CardContent>
        </Card>
    );
}
