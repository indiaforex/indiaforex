"use client";

import { ForumComment } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, Reply, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { deleteComment, toggleLikeComment } from "@/app/actions"; // verify export
import { toast } from "sonner";

interface CommentItemProps {
    comment: ForumComment;
    isReply?: boolean;
    threadId: string;
    onReply: () => void;
}

export function CommentItem({ comment, isReply = false, threadId, onReply }: CommentItemProps) {
    const { user } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [liked, setLiked] = useState(false); // Ideally derived from prop if we check 'isLikedByMe'
    const [likesCount, setLikesCount] = useState(comment.likes_count);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = user?.id === comment.author_id;

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            setShowAuth(true);
            return;
        }

        // Optimistic update
        const newliked = !liked;
        setLiked(newliked);
        setLikesCount(prev => newliked ? prev + 1 : prev - 1);

        try {
            await toggleLikeComment(comment.id, threadId);
        } catch (error) {
            // Revert
            setLiked(!newliked);
            setLikesCount(prev => !newliked ? prev + 1 : prev - 1);
            toast.error("Failed to update like");
        }
    };

    const handleReplyClick = () => {
        if (!user) {
            setShowAuth(true);
            return;
        }
        onReply();
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        setIsDeleting(true);
        try {
            await deleteComment(comment.id, threadId);
            toast.success("Comment deleted");
        } catch (error) {
            toast.error("Failed to delete comment");
            setIsDeleting(false);
        }
    };

    if (isDeleting) {
        return <div className="text-xs text-red-900 font-mono py-2 ml-4">Deleting...</div>;
    }

    return (
        <div className={cn("flex flex-col", isReply ? "ml-6 mt-1.5 pl-3 border-l border-slate-800" : "py-2.5 border-b border-slate-800/50 last:border-0")}>
            <div className="flex gap-2.5 group">
                <div className="h-6 w-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    {comment.author?.avatar_url ? (
                        <img src={comment.author.avatar_url} alt={comment.author.username} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{comment.author?.username?.substring(0, 2).toUpperCase()}</span>
                    )}
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300 font-mono">{comment.author?.username}</span>
                            <span className="text-[10px] text-slate-600 font-mono">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.author?.role === 'high_level' && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 rounded uppercase tracking-wider">MOD</span>
                            )}
                        </div>

                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-500 p-1"
                                title="Delete Comment"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-slate-400 leading-snug font-mono whitespace-pre-wrap">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-3 pt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleLike}
                            className={cn("flex items-center gap-1 text-[10px] hover:text-emerald-400 transition-colors", liked ? "text-emerald-500" : "text-slate-600")}
                        >
                            <ThumbsUp className="h-3 w-3" />
                            <span>{likesCount}</span>
                        </button>
                        <button
                            onClick={handleReplyClick}
                            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-emerald-400 transition-colors"
                        >
                            <Reply className="h-3 w-3" />
                            <span>Reply</span>
                        </button>
                    </div>
                </div>
            </div>

            <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
        </div>
    );
}
