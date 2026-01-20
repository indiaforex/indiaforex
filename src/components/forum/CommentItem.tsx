"use client";

import { ForumComment } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, Reply, Trash2, Edit, Save, X, MinusSquare, PlusSquare, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { deleteComment, toggleLikeComment, updateComment } from "@/app/actions"; // verify export
import { reportContent } from "@/lib/moderation";
import { toast } from "sonner";
import { MarkdownPreview, RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/button";
import { UserBadgeList } from "./UserBadge";

interface CommentItemProps {
    comment: ForumComment;
    isReply?: boolean;
    threadId: string;
    onReply: () => void;
    isNew?: boolean;
    onRead?: () => void;
    children?: React.ReactNode;
    replyCount?: number;
}

export function CommentItem({ comment, isReply = false, threadId, onReply, isNew = false, onRead, children, replyCount = 0 }: CommentItemProps) {
    const { user } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [liked, setLiked] = useState(false); // Ideally derived from prop if we check 'isLikedByMe'
    const [likesCount, setLikesCount] = useState(comment.likes_count);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

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
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdate = async () => {
        try {
            await updateComment(comment.id, editContent, threadId);
            toast.success("Comment updated");
            setIsEditing(false);
        } catch (error) {
            toast.error("Failed to update comment");
        }
    };

    const handleReport = async () => {
        if (!user) {
            setShowAuth(true);
            return;
        }
        const reason = prompt("Why are you reporting this comment?");
        if (!reason) return;

        try {
            const res = await reportContent('comment', comment.id, reason);
            if (res.error) throw new Error(res.error);
            toast.success("Report submitted for review");
        } catch (error) {
            toast.error("Failed to submit report");
        }
    };

    if (isDeleting) {
        return <div className="text-xs text-red-900 font-mono py-2 ml-4">Deleting...</div>;
    }

    return (
        <div
            onMouseEnter={() => {
                if (isNew && onRead) onRead();
            }}
            className={cn("flex flex-col transition-colors duration-1000", isReply ? "ml-6 mt-1.5 pl-3 border-l border-slate-800" : "py-2.5 border-b border-slate-800/50 last:border-0", isNew && "bg-emerald-950/20 shadow-[inset_2px_0_0_0_rgba(16,185,129,0.5)]")}
        >
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
                            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1">
                                {comment.author?.username}
                                <UserBadgeList badges={comment.author?.badges} className="flex gap-0.5" />
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.author?.role === 'high_level' && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 rounded uppercase tracking-wider">MOD</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                                className="text-slate-500 hover:text-emerald-500 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                title={isCollapsed ? "Expand" : "Collapse"}
                            >
                                {isCollapsed ? <PlusSquare className="h-3 w-3" /> : <MinusSquare className="h-3 w-3" />}
                            </button>

                            {/* Collapsed Placeholder - Updated with Count */}
                            {isCollapsed && (
                                <span className="text-[10px] text-slate-500 font-mono italic select-none cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => setIsCollapsed(false)}>
                                    {replyCount > 0 ? `(${replyCount} replies hidden)` : '(Content hidden)'}
                                </span>
                            )}

                            {isOwner && !isEditing && !isCollapsed && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-600 hover:text-emerald-500 p-1"
                                    title="Edit Comment"
                                >
                                    <Edit className="h-3 w-3" />
                                </button>
                            )}
                            {isOwner && !isCollapsed && (
                                <button
                                    onClick={handleDelete}
                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-500 p-1"
                                    title="Delete Comment"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isCollapsed && (
                        <>
                            {isEditing ? (
                                <div className="space-y-2 mt-2">
                                    <div onMouseDown={(e) => e.stopPropagation()}>
                                        <RichTextEditor
                                            value={editContent}
                                            onChange={(val) => setEditContent(val || "")}
                                            height={150}
                                            preview="edit"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 w-7 p-0 hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></Button>
                                        <Button size="sm" onClick={handleUpdate} className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-mono">
                                            <Save className="h-3 w-3" /> Save
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 leading-snug font-mono whitespace-normal">
                                    <MarkdownPreview
                                        source={comment.content}
                                        style={{ backgroundColor: 'transparent', color: 'inherit', fontSize: '0.75rem' }}
                                        className="!bg-transparent !text-slate-400 font-mono"
                                    />
                                </div>
                            )}

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
                                {!isOwner && (
                                    <button
                                        onClick={handleReport}
                                        className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-red-400 transition-colors ml-2"
                                        title="Report"
                                    >
                                        <Flag className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Replies (Children) */}
            {
                !isCollapsed && children && (
                    <div className="mt-2">
                        {children}
                    </div>
                )
            }

            <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
        </div >
    );
}
