"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Notification = {
    id: string;
    type: 'reply_thread' | 'reply_comment' | 'mention' | 'like';
    resource_id: string;
    resource_slug: string;
    content_preview: string;
    is_read: boolean;
    created_at: string;
    actor: {
        username: string;
        avatar_url: string;
    };
};

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
          *,
          actor:actor_id(username, avatar_url)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data as any);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Subscribe to realtime
        const channel = supabase
            .channel('notifications-bell')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, async (payload) => {
                // Fetch full data for the new notification (need actor details)
                const { data } = await supabase
                    .from('notifications')
                    .select(`*, actor:actor_id(username, avatar_url)`)
                    .eq('id', payload.new.id)
                    .single();

                if (data) {
                    setNotifications(prev => [data as any, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.info("New notification received");
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async () => {
        if (!user) return;
        if (unreadCount === 0) return;

        // Optimistic
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id)
            .eq('is_read', false);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            markAsRead();
        }
    };

    if (!user) return null;

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-slate-800">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/50" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <h4 className="font-bold text-sm text-slate-200 font-mono">Notifications</h4>
                    {unreadCount > 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm font-mono">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {Object.values(notifications.reduce((acc, n) => {
                                const key = `${n.type}-${n.resource_id}`;
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(n);
                                return acc;
                            }, {} as Record<string, Notification[]>)).map(group => {
                                const latest = group[0];
                                const count = group.length;
                                const others = count - 1;

                                return (
                                    <Link
                                        key={latest.id}
                                        href={`/forum/${latest.resource_slug}`}
                                        className={`p-4 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors flex gap-3 ${group.some(n => !n.is_read) ? 'bg-slate-900/20' : ''}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="h-8 w-8 rounded bg-slate-800 shrink-0 flex items-center justify-center overflow-hidden border border-slate-700">
                                            {latest.actor.avatar_url ? (
                                                <img src={latest.actor.avatar_url} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">{latest.actor.username.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-300">
                                                <span className="font-bold text-slate-200">{latest.actor.username}</span>
                                                {others > 0 && <span className="text-slate-500"> and {others} others</span>}
                                                {latest.type === 'reply_thread' && (others > 0 ? " replied to your thread" : " replied to your thread")}
                                                {latest.type === 'reply_comment' && (others > 0 ? " replied to your comment" : " replied to your comment")}
                                                {latest.type === 'mention' && (others > 0 ? " mentioned you" : " mentioned you")}
                                                {latest.type === 'like' && (others > 0 ? " liked your post" : " liked your post")}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 font-mono italic">
                                                "{latest.content_preview}"
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-1">
                                                {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {group.some(n => !n.is_read) && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
