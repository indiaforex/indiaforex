import { getThreadById, getComments, getThreadView, recordThreadView } from "@/lib/forum";
import { createClient } from "@/lib/supabase/server";
import { CommentSection } from "@/components/forum/CommentSection";
import { ThreadActions } from "@/components/forum/ThreadActions";
import { PollDisplay } from "@/components/forum/PollDisplay";
import { AddPollDialog } from "@/components/forum/AddPollDialog";
import { PollHistoryDialog } from "@/components/forum/PollHistoryDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/forum/ShareDialog";
import { BookmarkButton } from "@/components/forum/BookmarkButton";
import { ThreadStickyHeader } from "@/components/forum/ThreadStickyHeader"; // New Import
import { ArrowLeft, Clock, Flag, Lock, Pin } from "lucide-react";

// ...

import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

// Ensure this matches your Next.js version params type
type Props = {
    params: Promise<{ threadId: string }>;
};

export default async function ThreadPage({ params }: Props) {
    const { threadId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const thread = await getThreadById(threadId, user?.id);

    if (!thread) {
        notFound();
    }

    // Fetch Last Viewed (for highlighting new comments)
    let lastViewedAt: string | null = null;
    if (user) {
        lastViewedAt = await getThreadView(threadId, user.id);
        // Record new view (Fire and forget, but non-blocking)
        recordThreadView(threadId, user.id).catch(err => console.error(err));
    }

    const comments = await getComments(threadId);

    return (
        <div className="mx-auto max-w-7xl font-mono flex flex-col -mb-14">
            <ThreadStickyHeader thread={thread} />
            {/* ... (rest of render) ... */}
            <div className="flex-1 min-h-0">
                <CommentSection comments={comments} threadId={threadId} lastViewedAt={lastViewedAt}>
                    <div className="pt-4">
                        <Link href="/forum" className="inline-flex items-center gap-2 group mb-4">
                            <Button variant="outline" size="sm" className="h-8 gap-2 bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all font-mono">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                Back To Forum
                            </Button>
                        </Link>

                        {/* Unified Thread Card */}
                        <div id="thread-main-card" className="border border-slate-800 bg-slate-950/50 p-3 md:p-5 rounded-lg relative overflow-hidden mb-6">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20"></div>

                            {/* Pin Icon (Absolute Top Left) */}
                            {thread.is_pinned && (
                                <div className="absolute top-0 left-0 pl-2 pt-2 z-10">
                                    <Pin className="h-4 w-4 text-amber-500 rotate-45 fill-amber-500/20" />
                                </div>
                            )}

                            {/* Thread Actions (Responsive) */}
                            <div className="flex justify-end mb-2 md:mb-0 md:absolute md:top-4 md:right-4 md:z-10 gap-2 items-center pl-2 pt-0 md:p-0">
                                <ThreadActions thread={thread} />
                            </div>

                            {/* Title */}
                            <h1 className={`text-lg md:text-xl font-bold text-slate-100 mb-4 leading-tight tracking-tight pl-2 pr-2 ${thread.is_pinned ? 'pt-0' : 'pt-0'}`}>
                                {thread.title}
                            </h1>

                            {/* Content (Description) */}
                            <article className="prose prose-invert prose-sm prose-p:font-mono prose-headings:font-mono max-w-none mb-4 leading-snug text-slate-300 pl-2">
                                <p className="whitespace-pre-wrap">
                                    {thread.content}
                                </p>
                            </article>

                            {/* Metadata (Moved Below) */}
                            <div className={`flex flex-wrap items-center gap-3 mb-4 text-xs pl-2 text-slate-500 font-mono pb-2 md:pb-4 ${thread.poll ? 'border-b border-slate-800/50' : ''}`}>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 md:bg-slate-800 md:text-slate-300 md:border-slate-700 font-bold uppercase text-[10px] tracking-wider">
                                    {thread.category}
                                </span>
                                <span className="text-slate-700">|</span>
                                <span>COORD: <span className="text-slate-300">{thread.author?.username}</span></span>
                                <span className="text-slate-700">|</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            {/* POLL DISPLAY */}
                            {thread.poll && (
                                <div className="mb-6 pl-2 max-w-2xl">
                                    <PollDisplay poll={thread.poll} />
                                </div>
                            )}

                            {/* Footer: Tags & Actions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 md:pt-4 border-t border-slate-800/50 pl-2">
                                {/* Left: Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {thread.tags.map(tag => (
                                        <span key={tag} className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Right: Actions */}
                                <div className="flex gap-2 flex-wrap justify-end">
                                    <AddPollDialog threadId={thread.id} existingActivePoll={!!thread.poll} authorId={thread.author_id} />
                                    {(thread.polls?.length ?? 0) > 0 && <PollHistoryDialog polls={thread.polls || []} />}
                                    <ShareDialog title={thread.title} threadId={thread.id} />
                                    <Button variant="ghost" size="sm" className="h-7 gap-2 text-[10px] font-mono text-slate-500 hover:text-rose-400 hover:bg-rose-950/10">
                                        <Flag className="h-3 w-3" /> REPORT
                                    </Button>
                                    <BookmarkButton threadId={thread.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </CommentSection>
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: Props) {
    const { threadId } = await params;
    // We need to fetch basic thread info without user context (for public OG)
    // Assuming getThreadById handles null userId safely
    const thread = await getThreadById(threadId, undefined);

    if (!thread) {
        return {
            title: 'Thread Not Found',
        };
    }

    const ogUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og`);
    ogUrl.searchParams.set('title', thread.title);
    ogUrl.searchParams.set('author', thread.author?.username || 'Anonymous');
    ogUrl.searchParams.set('replies', thread.reply_count.toString());
    ogUrl.searchParams.set('likes', thread.likes_count.toString());

    return {
        title: `${thread.title} | Indian Market Board`,
        description: thread.content.slice(0, 160),
        openGraph: {
            title: thread.title,
            description: thread.content.slice(0, 160),
            images: [
                {
                    url: ogUrl.toString(),
                    width: 1200,
                    height: 630,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: thread.title,
            description: thread.content.slice(0, 160),
            images: [ogUrl.toString()],
        },
    };
}
