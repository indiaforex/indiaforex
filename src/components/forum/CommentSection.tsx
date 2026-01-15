"use client";

import { ForumComment, UserProfile } from "@/types/forum";
import { CommentItem } from "./CommentItem";
import { MessageSquare } from "lucide-react";
import { AddCommentForm } from "./AddCommentForm";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";

interface CommentSectionProps {
    threadId: string;
    comments: ForumComment[];
    children?: React.ReactNode;
}

export function CommentSection({ threadId, comments: initialComments, children }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState(initialComments);
    const scrollRef = useRef<HTMLDivElement>(null);
    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

    // State for Reply Mode
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyingUserProfile, setReplyingUserProfile] = useState<UserProfile | undefined>(undefined);

    // Update state on prop change
    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    // Auto-scroll to bottom on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    const handleReply = (commentId: string, author?: UserProfile) => {
        setReplyingToId(commentId);
        setReplyingUserProfile(author);
    };

    const handleCancelReply = () => {
        setReplyingToId(null);
        setReplyingUserProfile(undefined);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            {/* Scrollable Content Area: Thread Post + Comments */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-4 px-1">
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
                            <div key={comment.id} className="group">
                                <CommentItem
                                    comment={comment}
                                    threadId={threadId}
                                    onReply={() => handleReply(comment.id, comment.author)}
                                />
                                {/* Render Replies */}
                                <div className="flex flex-col mt-2 border-l border-slate-800/50 pl-4">
                                    {getReplies(comment.id).map(reply => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            isReply
                                            threadId={threadId}
                                            onReply={() => handleReply(reply.id, reply.author)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Fixed Bottom Input Area */}
            <div className="shrink-0 bg-slate-950/80 backdrop-blur-sm border-t border-slate-800 pt-2 pb-1 relative z-10 w-full">
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
