import { getThreadById, getComments } from "@/lib/forum";
import { CommentSection } from "@/components/forum/CommentSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Flag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

// Ensure this matches your Next.js version params type
type Props = {
    params: Promise<{ threadId: string }>;
};

export default async function ThreadPage({ params }: Props) {
    const { threadId } = await params;
    const thread = await getThreadById(threadId);

    if (!thread) {
        notFound();
    }

    const comments = await getComments(threadId);

    return (
        <div className="mx-auto max-w-7xl font-mono h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
            {/* Center Content - Managed by CommentSection for Scroll/Chat Layout */}
            <div className="flex-1 min-h-0">
                <CommentSection comments={comments} threadId={threadId}>
                    <div className="pt-4">
                        <Link href="/forum" className="inline-flex items-center gap-2 group mb-4">
                            <Button variant="outline" size="sm" className="h-8 gap-2 bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all font-mono">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                Back To Dashboard
                            </Button>
                        </Link>

                        {/* Unified Thread Card */}
                        <div className="border border-slate-800 bg-slate-950/50 p-5 rounded-lg relative overflow-hidden mb-6">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20"></div>

                            {/* Metadata Header */}
                            <div className="flex items-center gap-3 mb-3 text-xs pl-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold uppercase text-[10px]">
                                    {thread.category}
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className="text-slate-400 text-[11px]">
                                    COORD: <span className="text-slate-200">{thread.author?.username}</span>
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-lg md:text-xl font-bold text-slate-100 mb-4 leading-tight tracking-tight pl-2">
                                {thread.title}
                            </h1>

                            {/* Content (Description) */}
                            <article className="prose prose-invert prose-sm prose-p:font-mono prose-headings:font-mono max-w-none mb-6 leading-snug text-slate-300 pl-2">
                                <p className="whitespace-pre-wrap">
                                    {thread.content}
                                </p>
                            </article>

                            {/* Footer: Tags & Actions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-800/50 pl-2">
                                {/* Left: Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {thread.tags.map(tag => (
                                        <span key={tag} className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Right: Actions */}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 gap-2 text-[10px] font-mono border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/30">
                                        <Share2 className="h-3 w-3" /> SHARE_THREAD
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 gap-2 text-[10px] font-mono text-slate-500 hover:text-rose-400 hover:bg-rose-950/10">
                                        <Flag className="h-3 w-3" /> REPORT
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CommentSection>
            </div>
        </div>
    );
}
