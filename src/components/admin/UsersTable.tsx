"use client";

import { useState, useEffect } from "react";
import { getUsers, banUser, unbanUser } from "@/lib/moderation";
import { UserProfile } from "@/types/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function UsersTable() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async (query?: string) => {
        setLoading(true);
        const data = await getUsers(query);
        setUsers(data);
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers(search);
    };

    const toggleBan = async (user: UserProfile) => {
        if (!confirm(user.is_banned ? `Unban ${user.username}?` : `Ban ${user.username}? This will prevent them from posting.`)) return;

        setProcessing(user.id);
        try {
            if (user.is_banned) {
                await unbanUser(user.id);
                toast.success("User unbanned");
            } else {
                await banUser(user.id);
                toast.success("User banned");
            }
            // Update local state
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: !u.is_banned } : u));
        } catch (e) {
            toast.error("Action failed");
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs bg-slate-900 border-slate-700"
                />
                <Button type="submit" variant="secondary" disabled={loading}>
                    <Search className="h-4 w-4 mr-2" /> Search
                </Button>
            </form>

            <div className="rounded-md border border-slate-700 bg-slate-900/50">
                <table className="w-full caption-bottom text-sm text-slate-300">
                    <thead className="[&_tr]:border-b [&_tr]:border-slate-700">
                        <tr className="border-b transition-colors hover:bg-slate-900/50">
                            <th className="h-12 px-4 text-left font-medium text-slate-400">User</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-400">Role</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-400">Reputation</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-400">Joined</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-400">Status</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-slate-800 border-slate-700 flex items-center justify-center overflow-hidden">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-secondary font-bold">{user.username?.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="font-medium">{user.username}</div>
                                </td>
                                <td className="p-4">{user.role}</td>
                                <td className="p-4">{user.reputation_points}</td>
                                <td className="p-4 text-slate-500">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</td>
                                <td className="p-4">
                                    {user.is_banned ? (
                                        <span className="text-red-500 font-medium">Banned</span>
                                    ) : (
                                        <span className="text-emerald-500">Active</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <Button
                                        size="sm"
                                        variant={user.is_banned ? "outline" : "destructive"}
                                        onClick={() => toggleBan(user)}
                                        disabled={!!processing || user.role === 'admin'}
                                        className="h-8"
                                    >
                                        {processing === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                            user.is_banned ? <><CheckCircle className="h-4 w-4 mr-2" /> Unban</> : <><Ban className="h-4 w-4 mr-2" /> Ban</>
                                        }
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
