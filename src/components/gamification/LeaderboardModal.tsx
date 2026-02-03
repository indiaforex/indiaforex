'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from 'lucide-react';
import { Leaderboard } from "./Leaderboard";

export function LeaderboardModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                >
                    <Crown className="w-3 h-3 mr-1" /> Top Traders
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-500" />
                        Leaderboard
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    <Leaderboard />
                </div>
            </DialogContent>
        </Dialog>
    );
}
