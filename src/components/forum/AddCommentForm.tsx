"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Send, Lock, X, CornerDownRight } from "lucide-react";
import { UserRole, UserProfile } from "@/types/forum";
import { toast } from "sonner";
import { createComment } from "@/app/actions";
import { cn } from "@/lib/utils";

interface AddCommentFormProps {
    threadId: string;
    parentId?: string | null;
    replyingTo?: UserProfile;
    onCancelReply?: () => void;
    autoFocus?: boolean;
    onOptimisticAdd?: (content: string, parentId?: string | null) => void;
}

export function AddCommentForm({ threadId, parentId, replyingTo, onCancelReply, autoFocus, onOptimisticAdd }: AddCommentFormProps) {
    const { user, profile, isLoading } = useAuth();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    // Remove textareaRef as we might not need it for RichTextEditor same way, or use internal ref if supported?
    // RichTextEditor doesn't expose ref to focus easily in this wrapper. 
    // We'll rely on autoFocus or just state.

    // Focus logic for reply:
    useEffect(() => {
        if (replyingTo) {
            setIsExpanded(true);
        }
    }, [replyingTo]);


    // --- ACCESS CONTROL LOGIC ---
    const canComment = (role?: UserRole): boolean => {
        if (!role) return false;
        return true;
    };

    const hasPermission = user && profile && canComment(profile.role);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        // Optimistic UI Update
        if (onOptimisticAdd) {
            onOptimisticAdd(content, parentId);
        }

        try {
            await createComment(threadId, content, parentId);
            setContent("");
            setIsExpanded(false);
            toast.success("Comment posted");

            // Reset reply mode if active
            if (onCancelReply) onCancelReply();

        } catch (error) {
            toast.error("Failed to post comment");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFocus = () => {
        setIsExpanded(true);
    };

    const handleCancel = () => {
        setIsExpanded(false);
        setContent("");
        if (onCancelReply) onCancelReply();
    };

    if (isLoading) return null;

    // Simplified container for fixed layout
    return (
        <div className="w-full">
            {/* Form */}

            {!user ? (
                <div className="flex items-center justify-between p-2 rounded border border-slate-800 bg-slate-900/50">
                    <p className="text-xs text-slate-400 font-mono">Login to join the discussion</p>
                </div>
            ) : !hasPermission ? (
                <div className="flex items-center gap-2 text-rose-500 p-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-mono">Posting restricted for role: {profile?.role}</span>
                </div>
            ) : (
                <div className="flex flex-col gap-2 relative shadow-2xl">
                    {/* Reply Context Indicator */}
                    {replyingTo && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 flex items-center justify-between bg-slate-900 border border-slate-700 rounded-md px-3 py-2 animate-in slide-in-from-bottom-2 fade-in shadow-lg">
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                                <CornerDownRight className="h-3 w-3" />
                                <span>Replying to <span className="font-bold text-slate-200">@{replyingTo.username}</span></span>
                            </div>
                            <button
                                type="button"
                                onClick={onCancelReply}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {!isExpanded && !replyingTo ? (
                        <div
                            onClick={handleFocus}
                            className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-500 cursor-text hover:border-emerald-500/50 transition-colors font-mono"
                        >
                            Add to the discussion...
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-200 space-y-2">
                            <RichTextEditor
                                value={content}
                                onChange={(val) => setContent(val || "")}
                                placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add to the discussion..."}
                                height={150}
                                preview="edit"
                                className="bg-slate-900 border-slate-700"
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleSubmit()}
                                    size="sm"
                                    disabled={isSubmitting || !content.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    {isSubmitting ? <span className="animate-spin text-[10px]">...</span> : <><Send className="mr-2 h-4 w-4" /> Post Comment</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div >
    );
}
