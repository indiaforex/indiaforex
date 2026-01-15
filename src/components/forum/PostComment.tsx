"use client";

import { useAuth } from "@/context/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export function PostComment({ threadId }: { threadId: string }) {
    const { user, profile } = useAuth();
    const [content, setContent] = useState("");
    const [showAuth, setShowAuth] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleFocus = () => {
        if (!user) {
            setShowAuth(true);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            setShowAuth(true);
            return;
        }
        if (!content.trim()) return;

        setSubmitting(true);
        // Simulate API call for MVP
        // In real app, call Supabase insert here and revalidate path
        await new Promise(r => setTimeout(r, 1000));

        console.log("Posting comment to", threadId, ":", content);

        setContent("");
        setSubmitting(false);
        // Toast success here
    };

    const initials = profile?.username?.substring(0, 2).toUpperCase() || "U";

    return (
        <div className="flex gap-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url || profile?.avatar_url} />
                <AvatarFallback>{user ? initials : "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <Textarea
                    placeholder={user ? "What are your thoughts?" : "Log in to share your thoughts..."}
                    className="min-h-[80px] bg-background/50 resize-y"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={handleFocus}
                />
                <div className="flex justify-end">
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
            <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
        </div>
    );
}
