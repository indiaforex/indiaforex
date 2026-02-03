'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { placeBet, BetDirection } from '@/lib/actions/prediction';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Market {
    id: string;
    symbol: string;
    target_date: string;
    open_price: number;
    question?: string;
    bet_config?: {
        presets: number[];
        allow_custom: boolean;
        min: number;
        max: number;
    };
}

interface UserBet {
    direction: 'UP' | 'DOWN';
    amount: number;
    status: 'PENDING' | 'WON' | 'LOST';
}

export function PredictionCard({
    market,
    userPoints,
    existingBet
}: {
    market: Market,
    userPoints: number,
    existingBet?: UserBet | null
}) {
    const [loading, setLoading] = useState(false);
    const [wager, setWager] = useState(100);

    const handleBet = async (direction: BetDirection) => {
        if (wager > userPoints) {
            toast.error(`Low Balance (${userPoints} pts)`);
            return;
        }

        setLoading(true);
        try {
            const res = await placeBet(market.id, direction, wager);
            if (res.success) {
                toast.success(`Bet Placed on ${direction}!`);
                // UI update ideally happens via server revalidation or optimistic UI
                // For now, we rely on page refresh or parent revalidation
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Failed to place bet");
        } finally {
            setLoading(false);
        }
    };

    const isBetPlaced = !!existingBet;

    return (
        <Card className={cn(
            "w-[280px] h-[190px] flex flex-col shrink-0 border bg-slate-950/40 relative overflow-hidden transition-all",
            isBetPlaced ? "border-emerald-500/30 bg-emerald-950/10" : "border-slate-800 hover:border-slate-700"
        )}>
            {/* Bet Placed Overlay state */}
            {isBetPlaced && (
                <div className="absolute top-2 right-2 z-10">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1 pr-2">
                        <CheckCircle2 className="w-3 h-3" />
                        {existingBet.direction}
                    </Badge>
                </div>
            )}

            <div className="p-3 space-y-2 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-200 tracking-tight">{market.symbol}</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 bg-slate-800 text-slate-400">
                                TODAY
                            </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">
                            Will close above <span className="text-slate-200 font-mono">{market.open_price}</span>?
                        </p>
                    </div>
                </div>

                {!isBetPlaced ? (
                    <div className="flex-1 flex flex-col justify-end gap-2">
                        {/* Wager Input & Presets - Single Row */}
                        <div className="flex gap-2 items-center">
                            {(!market.bet_config || market.bet_config.allow_custom) && (
                                <div className="relative w-20">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">₹</span>
                                    <Input
                                        type="number"
                                        value={wager}
                                        onChange={(e) => setWager(Number(e.target.value))}
                                        className="h-7 text-xs pl-4 bg-slate-900/50 border-slate-800 focus-visible:ring-emerald-500/50"
                                        min={market.bet_config?.min || 1}
                                        max={market.bet_config?.max ? Math.min(market.bet_config.max, userPoints) : userPoints}
                                    />
                                </div>
                            )}
                            <div className="flex flex-1 gap-1">
                                {(market.bet_config?.presets || [100, 500, 1000]).map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setWager(amt)}
                                        className={cn(
                                            "flex-1 text-[10px] font-mono py-1 rounded transition-colors border border-transparent",
                                            wager === amt
                                                ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                                        )}
                                    >
                                        {amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-rose-900/50 bg-rose-950/10 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-800"
                                onClick={() => handleBet('DOWN')}
                                disabled={loading}
                            >
                                <TrendingDown className="w-3 h-3 mr-1.5" />
                                NO
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 hover:text-emerald-300"
                                onClick={() => handleBet('UP')}
                                disabled={loading}
                            >
                                <TrendingUp className="w-3 h-3 mr-1.5" />
                                YES
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Existing Bet State - Compact Row Layout */
                    <div className="flex-1 flex flex-col justify-center gap-2 bg-slate-900/30 rounded border border-slate-800/50 p-3 mt-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Wager</span>
                            <span className="text-sm font-bold text-white font-mono">{existingBet.amount}</span>
                        </div>
                        <div className="w-full h-px bg-slate-800/50" />
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-500/80 uppercase tracking-wider">Win</span>
                            <span className="text-base font-bold text-emerald-400 font-mono text-shadow-glow">
                                {(existingBet.amount * 2).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Odds Footer */}
            <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span>Odds: <span className="text-slate-300 font-mono">2.0x</span></span>
                <span>Ends: Market Close</span>
            </div>
        </Card>
    );
}
