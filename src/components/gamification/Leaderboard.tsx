'use client';

import { useEffect, useState } from "react";
import { fetchLeaderboard, fetchUserRank } from "@/lib/actions/gamification";
import { LeaderboardEntry } from "@/lib/leaderboard";
import { Trophy, Medal, Crown } from 'lucide-react';
import Image from "next/image";

export function Leaderboard() {
    const [users, setUsers] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [leaderboardData, rankData] = await Promise.all([
                    fetchLeaderboard(),
                    fetchUserRank()
                ]);
                setUsers(leaderboardData);
                setMyRank(rankData);
            } catch (e) {
                console.error("Failed to load leaderboard", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return <div className="text-center p-4 text-xs text-slate-400">Loading Leaderboard...</div>;
    }

    return (
        <div className="space-y-4">
            {/* My Rank Banner */}
            {myRank && (
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-slate-200">Your Rank</span>
                    </div>
                    <span className="text-lg font-bold text-white">#{myRank}</span>
                </div>
            )}

            <div className="space-y-1">
                {users.map((user, index) => (
                    <div
                        key={`${user.userId}-${index}`}
                        className={`flex items-center justify-between p-2 rounded-md ${index < 3 ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 text-center font-mono text-xs text-slate-500">
                                {index + 1}
                            </div>

                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700">
                                {user.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt={user.username} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                        {user.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <span className={`text-sm font-medium ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                                    {user.username}
                                </span>
                            </div>
                        </div>

                        <div className="text-xs font-mono text-emerald-400">
                            {(user.score || 0).toLocaleString()} PTS
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="text-center p-8 text-xs text-slate-500">
                    No active traders yet. Be the first!
                </div>
            )}
        </div>
    );
}
