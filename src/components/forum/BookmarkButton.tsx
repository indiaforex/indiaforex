"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function BookmarkButton({ threadId }: { threadId: string }) {
    const { user } = useAuth();
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;
        const checkBookmark = async () => {
            const { data } = await supabase
                .from('forum_bookmarks')
                .select('id')
                .eq('user_id', user.id)
                .eq('thread_id', threadId)
                .maybeSingle();
            setBookmarked(!!data);
        };
        checkBookmark();
    }, [user, threadId]);

    const toggleBookmark = async () => {
        if (!user) {
            toast.error("Please sign in to bookmark threads");
            return;
        }

        setLoading(true);
        // Optimistic
        const previousState = bookmarked;
        setBookmarked(!previousState);

        try {
            if (previousState) {
                // Remove
                const { error } = await supabase
                    .from('forum_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('thread_id', threadId);
                if (error) throw error;
                toast.success("Bookmark removed");
            } else {
                // Add
                const { error } = await supabase
                    .from('forum_bookmarks')
                    .insert({ user_id: user.id, thread_id: threadId });
                if (error) throw error;
                toast.success("Thread bookmarked");
            }
        } catch (err) {
            setBookmarked(previousState);
            toast.error("Failed to update bookmark");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleBookmark}
            disabled={loading}
            className={cn(
                "h-7 gap-2 text-[10px] font-mono hover:bg-slate-800 transition-colors",
                bookmarked ? "text-amber-500 hover:text-amber-400" : "text-slate-500 hover:text-amber-400"
            )}
        >
            <Bookmark className={cn("h-3 w-3", bookmarked && "fill-current")} />
            <span className="hidden sm:inline">{bookmarked ? "SAVED" : "SAVE"}</span>
        </Button>
    );
}
