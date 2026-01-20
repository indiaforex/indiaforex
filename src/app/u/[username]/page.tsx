import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Calendar, Settings, Activity, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getUserThreads, getUserComments, getUserStats } from "@/lib/forum";
import Link from "next/link";

type Props = {
    params: Promise<{ username: string }>;
};

export default async function ProfilePage({ params }: Props) {
    const { username } = await params;
    const supabase = await createClient();

    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

    if (!profile) {
        notFound();
    }

    // 2. Check if Current User is Owner
    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = user?.id === profile.id;

    // 3. Fetch Stats & Activity
    const stats = await getUserStats(profile.id);
    const threads = await getUserThreads(profile.id);
    const comments = await getUserComments(profile.id);


    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl space-y-6 font-mono p-4">
                {/* Profile Banner Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 relative overflow-hidden shadow-sm">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-cyan-500/50"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="relative flex flex-col md:flex-row items-start gap-6 pt-4">
                        <Avatar className="h-28 w-28 border-4 border-slate-900 shadow-xl bg-slate-800">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-3xl font-bold bg-slate-800 text-emerald-500">
                                {profile.username?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{profile.username}</h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5 text-[10px] uppercase">
                                            {profile.role || 'Member'}
                                        </Badge>
                                        <span className="text-slate-600">|</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <Calendar className="h-3 w-3" />
                                            Joined {format(new Date(profile.created_at), "MMM yyyy")}
                                        </span>
                                    </div>
                                </div>
                                {isOwner && (
                                    <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800 hover:text-white">
                                        <Settings className="h-4 w-4" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-4 w-full md:w-fit">
                                <div className="text-center md:text-left pr-6 border-r border-slate-800/50 last:border-0">
                                    <div className="text-2xl font-bold text-white">{stats.reputation || 0}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Reputation</div>
                                </div>
                                <div className="text-center md:text-left px-6 border-r border-slate-800/50 last:border-0">
                                    <div className="text-2xl font-bold text-white">{stats.threadCount || 0}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Threads</div>
                                </div>
                                <div className="text-center md:text-left pl-6">
                                    <div className="text-2xl font-bold text-white">{stats.commentCount || 0}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Comments</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Threads */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-white">RECENT THREADS</h3>
                        </div>
                        <div className="space-y-3">
                            {threads.length === 0 ? (
                                <p className="text-xs text-slate-600 italic">No threads created yet.</p>
                            ) : (
                                threads.map(thread => (
                                    <Link key={thread.id} href={`/forum/${thread.id}`} className="block group">
                                        <div className="border border-slate-800 bg-slate-900/40 p-3 rounded-lg hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
                                            <h4 className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 truncate transition-colors">
                                                {thread.title}
                                            </h4>
                                            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                                <span className="bg-slate-800 px-1.5 py-0.5 rounded">{thread.category}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {thread.likes_count}</span>
                                                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {thread.reply_count}</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(thread.created_at), "MMM d")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Comments */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <MessageSquare className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-white">RECENT COMMENTS</h3>
                        </div>
                        <div className="space-y-3">
                            {comments.length === 0 ? (
                                <p className="text-xs text-slate-600 italic">No comments posted yet.</p>
                            ) : (
                                comments.map(comment => (
                                    <Link key={comment.id} href={`/forum/${comment.thread_id}`} className="block group">
                                        <div className="border border-slate-800 bg-slate-900/20 p-3 rounded-lg hover:border-emerald-500/20 hover:bg-slate-900/40 transition-all">
                                            <p className="text-xs text-slate-400 line-clamp-2 italic group-hover:text-slate-300">
                                                "{comment.content}"
                                            </p>
                                            <div className="flex items-center justify-end mt-2 text-[10px] text-slate-600">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(comment.created_at), "MMM d, HH:mm")}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
