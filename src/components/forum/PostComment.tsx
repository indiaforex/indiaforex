"use client";

import { useAuth } from "@/context/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PostComment({ threadId }: { threadId: string }) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [content, setContent] = useState("");
    const [showAuth, setShowAuth] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [isExpanded, setIsExpanded] = useState(false);

    const handleFocus = () => {
        if (!user) {
            setShowAuth(true);
            return;
        }
        setIsExpanded(true);
    };

    const handleSubmit = async () => {
        if (!user) {
            setShowAuth(true);
            return;
        }
        if (!content.trim()) return;

        setSubmitting(true);
        const supabase = createClient();

        const { error } = await supabase.from('forum_comments').insert({
            thread_id: threadId,
            author_id: user.id,
            content: content
        });

        setSubmitting(false);

        if (error) {
            toast.error("Failed to post comment");
        } else {
            setContent("");
            setIsExpanded(false);
            toast.success("Comment posted!");
            router.refresh();
        }
    };

    const initials = profile?.username?.substring(0, 2).toUpperCase() || "U";

    return (
        <div className="flex gap-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url || profile?.avatar_url} />
                <AvatarFallback>{user ? initials : "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                {!isExpanded ? (
                    <div
                        onClick={handleFocus}
                        className="w-full h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 cursor-text hover:border-slate-700 transition-colors"
                    >
                        {user ? "What are your thoughts?" : "Log in to share your thoughts..."}
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <RichTextEditor
                            placeholder="What are your thoughts?"
                            value={content}
                            onChange={(val) => setContent(val || "")}
                            height={150}
                            preview="edit"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsExpanded(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={submitting || !content.trim()}
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Post Comment
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
        </div>
    );
}
