"use client";

import { useAuth } from "@/context/AuthProvider";
import { voteOnPoll } from "@/lib/forum";
import { Poll } from "@/types/forum";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PollDisplayProps {
    poll: Poll;
}

export function PollDisplay({ poll }: PollDisplayProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Optimistic State
    const [hasVoted, setHasVoted] = useState(false);
    const [options, setOptions] = useState(poll.options);

    const isClosed = poll.status === 'closed';

    // Check if user has voted based on server data
    useEffect(() => {
        setOptions(poll.options);
        // Check if user ID is in the user_vote_ids array
        if (user && poll.user_vote_ids && poll.user_vote_ids.length > 0) {
            setHasVoted(true);
        } else {
            setHasVoted(false);
        }
    }, [poll.options, poll.user_vote_ids, user]);

    const totalVotes = options.reduce((acc, opt) => acc + opt.votes, 0);

    const handleVote = async (optionId: string) => {
        if (!user) {
            toast.error("Please login to vote.");
            return;
        }
        if (isClosed) return;

        if (loading || hasVoted) {
            if (hasVoted) toast.info("You have already voted.");
            return;
        }

        // 1. Optimistic Update
        const previousOptions = [...options];
        setHasVoted(true);
        setOptions(prev => prev.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ));

        setLoading(true);

        try {
            // 2. Server Request
            const { error } = await voteOnPoll(poll.id, optionId, user.id);

            if (error) {
                // 3. Rollback on Error
                setHasVoted(false);
                setOptions(previousOptions);
                toast.error(error);
            } else {
                // 4. Success
                toast.success("Vote registered!");
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            setHasVoted(false);
            setOptions(previousOptions);
            toast.error("Failed to submit vote");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "bg-slate-900/50 border rounded-lg p-4 my-2", // Compact padding/margin
            isClosed ? "border-slate-800 opacity-75" : "border-slate-800"
        )}>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 flex-wrap leading-none">
                <span className="text-emerald-500 text-xs tracking-wider">POLL</span>
                {isClosed && <span className="bg-red-500/10 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/20">CLOSED</span>}
                <span className="text-slate-200">{poll.question}</span>
                {poll.allow_multiple && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-auto">Multi</span>}
            </h3>

            <div className="space-y-2">
                {options.map((option) => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                    return (
                        <div
                            key={option.id}
                            onClick={() => !hasVoted && !isClosed && handleVote(option.id)}
                            className={cn(
                                "relative group overflow-hidden rounded border px-3 py-2 transition-all",
                                hasVoted || isClosed
                                    ? "border-slate-800 cursor-default"
                                    : "border-slate-700 cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50"
                            )}
                        >
                            {/* Progress Bar Background */}
                            <motion.div
                                className="absolute top-0 left-0 bottom-0 bg-emerald-500/10 z-0"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5 }}
                            />

                            <div className="relative z-10 flex items-center justify-between pointer-events-none">
                                <span className={cn(
                                    "font-medium text-xs",
                                    (hasVoted || isClosed) ? "text-slate-300" : "text-slate-200 group-hover:text-emerald-400"
                                )}>
                                    {option.label}
                                </span>

                                {(hasVoted || isClosed) ? (
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                        <span className="text-white font-bold">{percentage}%</span>
                                        <span className="text-slate-500">({option.votes})</span>
                                    </div>
                                ) : (
                                    <div className="w-3 h-3 rounded-full border border-slate-600 group-hover:border-emerald-500 mr-1"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                <span>Total Votes: {totalVotes}</span>
                {loading && <span className="flex items-center gap-1 text-emerald-500"><Loader2 className="h-3 w-3 animate-spin" /> Syncing...</span>}
            </div>
        </div>
    );
}
