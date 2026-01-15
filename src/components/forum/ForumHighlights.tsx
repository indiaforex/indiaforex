import { ForumThread } from "@/types/forum";
import { ThreadCard } from "./ThreadCard";
import { CreateThreadModal } from "./CreateThreadModal";
import { ArrowRight, ThumbsUp, MessageSquare } from "lucide-react";
import Link from "next/link";

interface ForumHighlightsProps {
    threads: ForumThread[];
}

export function ForumHighlights({ threads }: ForumHighlightsProps) {
    return (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white">Community Discussions</h2>
                        <p className="text-xs text-slate-500 font-mono">LATEST INTEL & CHATTER</p>
                    </div>
                </div>
                <CreateThreadModal />
            </div>

            <div className="flex flex-col gap-2">
                {threads.length === 0 ? (
                    <p className="text-center text-sm text-slate-500 py-4 font-mono">No active discussions.</p>
                ) : (
                    threads.map((thread) => (
                        <Link
                            key={thread.id}
                            href={`/forum/${thread.id}`}
                            className="group block border border-slate-800 bg-slate-900/30 p-3 rounded-lg hover:bg-slate-900 hover:border-emerald-500/30 transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                                        {thread.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                                        <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                                            {thread.category}
                                        </span>
                                        <span>•</span>
                                        <span className="truncate max-w-[80px]">{thread.author?.username}</span>
                                        <span>•</span>
                                        <span>{new Date(thread.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-500 font-mono">
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="h-3 w-3" />
                                        <span>{thread.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        <span>{thread.reply_count}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <div className="pt-2">
                <Link href="/forum" className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500 hover:text-emerald-400 transition-colors w-full py-2 border border-dashed border-slate-800 rounded hover:border-emerald-500/30 hover:bg-slate-900">
                    VIEW_ALL_THREADS <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </section>
    );
}
