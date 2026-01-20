"use client";

import { ForumComment, UserProfile } from "@/types/forum";
import { CommentItem } from "./CommentItem";
import { MessageSquare } from "lucide-react";
import { AddCommentForm } from "./AddCommentForm";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CommentSectionProps {
    threadId: string;
    comments: ForumComment[];
    children?: React.ReactNode;
    lastViewedAt?: string | null;
}

export function CommentSection({ threadId, comments: initialComments, children, lastViewedAt }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState(initialComments);
    const scrollRef = useRef<HTMLDivElement>(null);
    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

    // State for Reply Mode
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyingUserProfile, setReplyingUserProfile] = useState<UserProfile | undefined>(undefined);

    // State for Read Comments (Local Session)
    const [readCommentIds, setReadCommentIds] = useState<Set<string>>(new Set());

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

    // Auto-scroll to bottom on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        // Realtime Subscription
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
                    .select('id, username, avatar_url, role, reputation_points, created_at')
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
            // Optionally flash it
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

    return (
        <div className="flex flex-col relative w-full">
            {/* Content Area: Thread Post + Comments */}
            <div ref={scrollRef} className="w-full px-1 relative pb-16">
                {/* Thread Content (passed as children) */}
                {children}

                <div className="mt-8 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold font-mono text-emerald-500">COMMENTS ({comments.length})</h3>
                </div>

                {/* List of Comments */}
                <div className="flex flex-col gap-4 pb-4">
                    {rootComments.length === 0 ? (
                        <p className="py-8 text-center text-slate-600 text-xs font-mono">// No comments yet. Be the first to share your thoughts!</p>
                    ) : (
                        rootComments.map(comment => (
                            <div key={comment.id} id={`comment-${comment.id}`} className="group">
                                <CommentItem
                                    comment={comment}
                                    threadId={threadId}
                                    onReply={() => handleReply(comment.id, comment.author)}
                                    isNew={(lastViewedAt ? new Date(comment.created_at) > new Date(lastViewedAt) : false) && !readCommentIds.has(comment.id)}
                                    onRead={() => handleMarkAsRead(comment.id)}
                                    replyCount={getReplies(comment.id).length}
                                >
                                    {getReplies(comment.id).length > 0 && (
                                        <div className="flex flex-col mt-2 border-l border-slate-800/50 pl-4">
                                            {getReplies(comment.id).map(reply => (
                                                <div key={reply.id} id={`comment-${reply.id}`}>
                                                    <CommentItem
                                                        comment={reply}
                                                        isReply
                                                        threadId={threadId}
                                                        onReply={() => handleReply(reply.id, reply.author)}
                                                        isNew={(lastViewedAt ? new Date(reply.created_at) > new Date(lastViewedAt) : false) && !readCommentIds.has(reply.id)}
                                                        onRead={() => handleMarkAsRead(reply.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CommentItem>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Jump to New Button */}
            {firstNewCommentId && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onClick={scrollToFirstNew}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg shadow-emerald-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 transition-all"
                    >
                        <span>Jump to New</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </button>
                </div>
            )}

            {/* Sticky Bottom Input Area */}
            <div className="shrink-0 bg-slate-950 border-t border-slate-800 p-2 sticky bottom-0 z-30 w-full">
                <AddCommentForm
                    threadId={threadId}
                    parentId={replyingToId}
                    replyingTo={replyingUserProfile}
                    onCancelReply={handleCancelReply}
                />
            </div>
        </div>
    );
}
