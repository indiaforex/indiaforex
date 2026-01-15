"use client";

import { ForumThread } from "@/types/forum";
import { MessageSquare, ThumbsUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ThreadCardProps {
    thread: ForumThread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
    const { user } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [liked, setLiked] = useState(false); // Optimistic UI for MVP

    const handleInteraction = (e: React.MouseEvent, type: 'like' | 'reply') => {
        e.preventDefault(); // Prevent link click if wrapped
        e.stopPropagation();

        if (!user) {
            setShowAuth(true);
            return;
        }

        if (type === 'like') {
            setLiked(!liked);
            // TODO: Call Supabase toggle like
        }
        // Reply usually just opens the thread, which they can do anyway. 
        // But if this was an inline reply button, we'd handle it.
    };

    return (
        <>
            <div className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-primary">{thread.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                {thread.author?.username || "Unknown"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <Link href={`/forum/${thread.id}`} target="_blank" className="font-semibold leading-tight hover:underline focus:underline decoration-primary underline-offset-4">
                            {thread.title}
                        </Link>
                    </div>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground/90">
                    {thread.content}
                </p>

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <button
                            onClick={(e) => handleInteraction(e, 'like')}
                            className={cn("flex items-center gap-1.5 hover:text-primary transition-colors", liked && "text-primary font-medium")}
                        >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span>{thread.likes_count + (liked ? 1 : 0)}</span>
                        </button>
                        <Link href={`/forum/${thread.id}`} target="_blank" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{thread.reply_count}</span>
                        </Link>
                    </div>

                    <div className="flex gap-2">
                        {thread.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
        </>
    );
}
