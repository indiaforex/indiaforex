"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
}

export function AddCommentForm({ threadId, parentId, replyingTo, onCancelReply, autoFocus }: AddCommentFormProps) {
    const { user, profile, isLoading } = useAuth();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when replyingTo changes
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo]);

    // --- ACCESS CONTROL LOGIC ---
    const canComment = (role?: UserRole): boolean => {
        if (!role) return false;
        return true;
    };

    const hasPermission = user && profile && canComment(profile.role);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        try {
            await createComment(threadId, content, parentId);
            setContent("");
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
                <form onSubmit={handleSubmit} className="flex flex-col gap-0 relative shadow-2xl">
                    {/* Reply Context Indicator (Absolute top, sliding up) */}
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

                    <div className={cn("flex gap-2 items-end bg-slate-900 border border-slate-700 rounded-lg p-2 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all shadow-inner", replyingTo && "rounded-b-lg")}>
                        <Textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add to the discussion..."}
                            className="min-h-[40px] max-h-[120px] bg-transparent border-0 focus-visible:ring-0 resize-none py-2 px-1 text-sm font-mono leading-relaxed w-full placeholder:text-slate-600"
                            autoFocus={autoFocus}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !content.trim()}
                            className="h-9 w-9 p-0 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md mb-0.5"
                        >
                            {isSubmitting ? <span className="animate-spin text-[10px]">...</span> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
