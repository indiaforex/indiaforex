"use client";

import { useRef } from "react";
import { PredictionCard } from "./PredictionCard";
import ScrollIndicator from "@/components/ui/scroll-indicator";
import { Trophy, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BetHistory } from "./BetHistory";
import { LeaderboardModal } from "../gamification/LeaderboardModal";

interface Market {
    id: string;
    symbol: string;
    target_date: string;
    open_price: number;
}

interface UserBet {
    market_id: string;
    direction: 'UP' | 'DOWN';
    amount: number;
    status: 'PENDING' | 'WON' | 'LOST';
}

export function PredictionCarousel({
    markets,
    userPoints,
    userBets,
    user
}: {
    markets: Market[],
    userPoints: number,
    userBets: UserBet[],
    user: any
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="space-y-3 relative group">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Daily Predictions</h2>
                        <p className="text-[10px] text-slate-500">Predict Closing Prices & Win Reputation</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-yellow-500/5 text-yellow-500 rounded border border-yellow-500/10 font-mono text-[10px] font-bold">
                                <Trophy className="w-3 h-3" />
                                {userPoints.toLocaleString()}
                            </div>

                            <LeaderboardModal />

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] text-slate-400 hover:text-slate-200"
                                    >
                                        <History className="w-3 h-3 mr-1" /> My Bets
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800">
                                    <DialogHeader>
                                        <DialogTitle>Bet History</DialogTitle>
                                    </DialogHeader>
                                    <BetHistory bets={userBets} />
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <div className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            Login to Play
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll Container */}
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
                {markets.map((market) => {
                    const myBet = userBets.find(b => b.market_id === market.id);
                    return (
                        <div key={market.id} className="snap-center">
                            <PredictionCard
                                market={market}
                                userPoints={userPoints}
                                existingBet={myBet}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Scroll Indicator - Rotated on the Right */}
            {/* Scroll Indicator - Rotated on the Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-500">
                <div className="-rotate-90 origin-center translate-x-[calc(50%-12px)]">
                    <ScrollIndicator containerRef={scrollRef} orientation="horizontal" className="bg-slate-950/80 px-2 py-1 rounded-full border border-slate-800 shadow-xl backdrop-blur-sm" />
                </div>
            </div>
        </div>
    );
}
