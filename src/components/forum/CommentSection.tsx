"use client";

import { ForumComment, UserProfile } from "@/types/forum";
import { CommentItem } from "./CommentItem";
import { MessageSquare, Loader2 } from "lucide-react";
import { AddCommentForm } from "./AddCommentForm";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { buildCommentTree, CommentNode } from "@/lib/commentTree";
import { fetchMoreComments } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface CommentSectionProps {
    threadId: string;
    comments: ForumComment[];
    children?: React.ReactNode;
    lastViewedAt?: string | null;
    totalComments: number;
}

export function CommentSection({ threadId, comments: initialComments, children, lastViewedAt, totalComments }: CommentSectionProps) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState(initialComments);
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Derived state for Load More
    const hasMore = comments.length < totalComments;

    const scrollRef = useRef<HTMLDivElement>(null);

    // State for Reply Mode
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyingUserProfile, setReplyingUserProfile] = useState<UserProfile | undefined>(undefined);

    // State for Read Comments (Local Session)
    const [readCommentIds, setReadCommentIds] = useState<Set<string>>(new Set());

    const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

    // Keep user in ref to avoid stale closure in subscription
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Update state on prop change
    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const handleMarkAsRead = (commentId: string) => {
        if (!readCommentIds.has(commentId)) {
            setReadCommentIds(prev => {
                const newSet = new Set(prev);
                newSet.add(commentId);
                return newSet;
            });
        }
    };

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await fetchMoreComments(threadId, nextPage);
            setComments(prev => {
                // Deduplicate just in case
                const newComments = res.comments.filter(nc => !prev.some(pc => pc.id === nc.id));
                return [...prev, ...newComments];
            });
            setPage(nextPage);
        } catch (error) {
            toast.error("Failed to load more comments");
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Auto-scroll to bottom on mount (Only if page 1?)
    useEffect(() => {
        if (scrollRef.current && page === 1) {
            // Only auto-scroll on initial load if needed, but 'scrollTop = scrollHeight' might be annoying if user is reading.
            // Maybe only if no lastViewedAt?
            // Existing behavior was: scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            // We'll keep it for now but it might fight with Load More if trigger happens.
            // Actually, usually you want to see the thread content first.
            // For now, I will NOT force scroll on every render, strictly on mount.
        }
    }, [page]);

    // Re-instating the mount scroll behavior from original code
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Realtime Subscription
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`comments-${threadId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'forum_comments',
                filter: `thread_id=eq.${threadId}`
            }, async (payload) => {
                const newComment = payload.new as ForumComment;

                // Ignore if I am the author (handled by AddCommentForm)
                if (userRef.current && newComment.author_id === userRef.current.id) return;

                // Fetch author details for the new comment to display correctly
                const { data: author } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url, role, reputation_points, created_at, is_banned')
                    .eq('id', newComment.author_id)
                    .single();

                if (author) {
                    newComment.author = author;
                }

                setComments(prev => {
                    // Avoid duplicates
                    if (prev.find(c => c.id === newComment.id)) return prev;
                    return [...prev, newComment];
                });

                toast.info("New comment received");
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [threadId]);

    // Jump to New Logic
    const [firstNewCommentId, setFirstNewCommentId] = useState<string | null>(null);

    useEffect(() => {
        if (!lastViewedAt) return;
        const lastViewed = new Date(lastViewedAt);
        const firstNew = comments.find(c => new Date(c.created_at) > lastViewed && !readCommentIds.has(c.id));
        setFirstNewCommentId(firstNew?.id || null);
    }, [comments, lastViewedAt, readCommentIds]);

    const scrollToFirstNew = () => {
        if (!firstNewCommentId) return;
        const element = document.getElementById(`comment-${firstNewCommentId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleReply = (commentId: string, author?: UserProfile) => {
        setReplyingToId(commentId);
        setReplyingUserProfile(author);
    };

    const handleCancelReply = () => {
        setReplyingToId(null);
        setReplyingUserProfile(undefined);
    };

    const handleOptimisticAdd = (content: string, parentId?: string | null) => {
        if (!user) return;

        const tempComment: ForumComment = {
            id: `temp-${Date.now()}`,
            thread_id: threadId,
            author_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            deleted_by: null,
            deletion_reason: null,
            parent_id: parentId || null,
            likes_count: 0,
            // reply_count: 0, // Not in type apparently
            // author object for display
            author: {
                id: user.id,
                username: profile?.username || user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url,
                role: profile?.role || 'user',
                reputation_points: profile?.reputation_points || 0,
                created_at: profile?.created_at || new Date().toISOString(),
                is_banned: false
            }
        };

        setComments(prev => [...prev, tempComment]);

        if (!parentId) {
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        }
    };

    return (
        <div className="flex flex-col relative w-full">
            {/* Content Area: Thread Post + Comments */}
            <div ref={scrollRef} className="w-full px-1 relative pb-16">
                {/* Thread Content (passed as children) */}
                {children}

                <div className="mt-8 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2 justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-sm font-bold font-mono text-emerald-500">COMMENTS ({totalComments + (comments.length - initialComments.length)})</h3>
                    </div>
                </div>

                {/* List of Comments */}
                <div className="flex flex-col gap-4 pb-4">
                    {comments.length === 0 ? (
                        <p className="py-8 text-center text-slate-600 text-xs font-mono">// No comments yet. Be the first to share your thoughts!</p>
                    ) : (
                        <RecursiveCommentList
                            nodes={commentTree}
                            threadId={threadId}
                            handleReply={handleReply}
                            handleMarkAsRead={handleMarkAsRead}
                            lastViewedAt={lastViewedAt}
                            readCommentIds={readCommentIds}
                        />
                    )}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="flex justify-center py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="text-xs font-mono border-slate-800 text-slate-400 hover:text-white"
                        >
                            {isLoadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                            Load More Comments
                        </Button>
                    </div>
                )}
            </div>
            {
                firstNewCommentId && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                        <button
                            onClick={scrollToFirstNew}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg shadow-emerald-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 transition-all"
                        >
                            <span>Jump to New</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        </button>
                    </div>
                )
            }

            {/* Sticky Bottom Input Area */}
            <div className="shrink-0 bg-slate-950 border-t border-slate-800 p-2 sticky bottom-0 z-30 w-full">
                <AddCommentForm
                    threadId={threadId}
                    parentId={replyingToId}
                    replyingTo={replyingUserProfile}
                    onCancelReply={handleCancelReply}
                    onOptimisticAdd={handleOptimisticAdd}
                />
            </div>
        </div >
    );
}

function RecursiveCommentList({
    nodes,
    threadId,
    handleReply,
    handleMarkAsRead,
    lastViewedAt,
    readCommentIds
}: {
    nodes: CommentNode[],
    threadId: string,
    handleReply: (id: string, author?: UserProfile) => void,
    handleMarkAsRead: (id: string) => void,
    lastViewedAt?: string | null,
    readCommentIds: Set<string>
}) {
    return (
        <>
            {nodes.map(node => (
                <div key={node.id} id={`comment-${node.id}`} className="group">
                    <CommentItem
                        comment={node}
                        threadId={threadId}
                        onReply={() => handleReply(node.id, node.author)}
                        isNew={(lastViewedAt ? new Date(node.created_at) > new Date(lastViewedAt) : false) && !readCommentIds.has(node.id)}
                        onRead={() => handleMarkAsRead(node.id)}
                        replyCount={node.children.length}
                        // Use isReply true if it has a parent (not root)
                        isReply={!!node.parent_id}
                    >
                        {node.children.length > 0 && (
                            <div className="flex flex-col mt-2 border-l border-slate-800/50 pl-4">
                                <RecursiveCommentList
                                    nodes={node.children}
                                    threadId={threadId}
                                    handleReply={handleReply}
                                    handleMarkAsRead={handleMarkAsRead}
                                    lastViewedAt={lastViewedAt}
                                    readCommentIds={readCommentIds}
                                />
                            </div>
                        )}
                    </CommentItem>
                </div>
            ))}
        </>
    );
}
