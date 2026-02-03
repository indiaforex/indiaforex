"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

interface Prediction {
    id: string;
    symbol: string;
    question: string;
    target_date: string;
}

export function PredictionList({ limit, compact, predictions = [] }: { limit?: number, compact?: boolean, predictions?: Prediction[] }) {
    // If no predictions passed, show skeleton or empty state
    // In real app, we might fetch client-side if missing, but better to pass from server.
    const displayPredictions = limit ? predictions.slice(0, limit) : predictions;

    if (!displayPredictions || !displayPredictions.length) {
        return <div className="text-xs text-slate-500 text-center py-2">No active markets.</div>;
    }

    return (
        <div className="space-y-2">
            {displayPredictions.map(market => (
                <Link key={market.id} href={`/prediction/${market.id}`} className="block group">
                    {/* Render Logic */}
                    <div className="flex justify-between items-center bg-slate-800/30 p-2 rounded hover:bg-slate-800/50 transition-colors">
                        <span className="text-xs font-mono text-emerald-400">{market.symbol}</span>
                        <span className="text-[10px] text-slate-400">{new Date(market.target_date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-1 group-hover:text-white">{market.question}</p>
                </Link>
            ))}
        </div>
    );
}
