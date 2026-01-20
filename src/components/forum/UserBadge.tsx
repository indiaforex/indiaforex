"use client";

import React from 'react';
import * as Icons from 'lucide-react';
import { Badge } from '@/types/forum';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Re-trigger TS

interface UserBadgeProps {
    badge: Badge;
    size?: number;
}

export function UserBadge({ badge, size = 16 }: UserBadgeProps) {
    // Dynamically resolve icon
    const IconComponent = (Icons as any)[badge.icon_name] || Icons.Award;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className={`inline-flex items-center justify-center p-0.5 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-help`}>
                        <IconComponent
                            size={size}
                            className={`${badge.color}`}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-slate-200">
                    <p className="font-semibold text-xs">{badge.name}</p>
                    {badge.description && (
                        <p className="text-[10px] text-slate-400 max-w-[150px]">{badge.description}</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

interface UserBadgeListProps {
    badges?: { badge?: Badge }[];
    className?: string;
}

export function UserBadgeList({ badges, className = "flex gap-1" }: UserBadgeListProps) {
    if (!badges || badges.length === 0) return null;

    return (
        <div className={className}>
            {badges.map((ub, idx) => (
                ub.badge ? <UserBadge key={idx} badge={ub.badge} /> : null
            ))}
        </div>
    );
}
