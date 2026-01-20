"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Poll } from "@/types/forum";
import { History } from "lucide-react";
import { PollDisplay } from "./PollDisplay";

interface PollHistoryDialogProps {
    polls: Poll[];
}

export function PollHistoryDialog({ polls }: PollHistoryDialogProps) {
    // Filter out active one if passed, or assumes all passed. Usually we pass inactive ones.
    const inactivePolls = polls.filter(p => p.status === 'closed');

    if (inactivePolls.length === 0) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-2 text-[10px] font-mono border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/30">
                    <History className="h-3 w-3" />
                    <span className="sm:hidden">HISTORY</span>
                    <span className="hidden sm:inline">PAST POLLS ({inactivePolls.length})</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800 text-slate-100 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Poll History</DialogTitle>
                </DialogHeader>
                <div className="space-y-8 py-4">
                    {inactivePolls.map((poll) => (
                        <div key={poll.id} className="opacity-80">
                            <div className="text-xs text-slate-500 mb-1">
                                Ends: {new Date(poll.expires_at || poll.created_at).toLocaleDateString()}
                            </div>
                            <PollDisplay poll={poll} /> {/* Reuse display but maybe set read-only? */}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
