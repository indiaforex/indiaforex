'use client';

import { useEffect, useState } from "react";
import { fetchUserAchievements } from "@/lib/actions/gamification";
import { Medal, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Achievement = {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
}

type UserAchievement = {
    unlocked_at: string;
    achievements: Achievement;
}

export function AchievementShowcase({ userId, variant = 'default' }: { userId?: string, variant?: 'default' | 'mini' }) {
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchUserAchievements(userId);
                setAchievements(data as any);
            } catch (e) {
                console.error("Failed to load achievements", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userId]);

    if (loading) return null;

    if (achievements.length === 0) {
        if (variant === 'mini') return null; // Don't show empty state in header
        return (
            <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50 text-center text-xs text-slate-500">
                <Medal className="w-6 h-6 mx-auto mb-2 opacity-20" />
                No badges earned yet.
            </div>
        );
    }

    const isMini = variant === 'mini';
    const containerClasses = isMini
        ? "w-8 h-8 flex-none"
        : "aspect-square w-16 h-16"; // Fixed smaller size for default too as requested
    const iconClasses = isMini
        ? "w-4 h-4 text-amber-500"
        : "w-8 h-8 text-amber-500";

    return (
        <div className={`flex flex-wrap gap-2 ${isMini ? 'justify-start' : 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6'}`}>
            <TooltipProvider>
                {achievements.map((ua) => {
                    const Icon = (LucideIcons as any)[ua.achievements.icon] || Medal;

                    return (
                        <Tooltip key={ua.achievements.id}>
                            <TooltipTrigger asChild>
                                <div className={`${containerClasses} rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center relative group cursor-help hover:border-amber-500/50 transition-colors`}>
                                    <Icon className={iconClasses} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-slate-950 border-slate-800 z-50">
                                <div className="text-xs">
                                    <div className="font-bold text-slate-200">{ua.achievements.name}</div>
                                    <div className="text-slate-500">{ua.achievements.description}</div>
                                    <div className="mt-1 text-amber-500 font-mono">+{ua.achievements.xp_reward} XP</div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
    );
}
