"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/forum";
import { ForumCategory } from "@/types/forum";
import {
    LayoutDashboard,
    TrendingUp,
    Bookmark,
    Hash,
    Globe,
    Code,
    Briefcase,
    Zap,
    ShieldAlert,
    Users
} from "lucide-react";
import { useAuth } from "@/context/AuthProvider";

const mainNav = [
    { name: "All Discussions", icon: LayoutDashboard, href: "/forum" },
    { name: "Popular", icon: TrendingUp, href: "/forum?sort=hot" },
    { name: "My Bookmarks", icon: Bookmark, href: "/forum?view=bookmarks" },
];

const ICON_MAP: Record<string, any> = {
    'forex': Globe,
    'crypto': Zap,
    'equities': Briefcase,
    'stocks': Briefcase,
    'algo-trading': Code,
    'fno': TrendingUp,
    'commodities': Users, // Placeholder
    'general': Hash,
    'vip_lounge': ShieldAlert
};

export function ForumSidebar() {
    const { profile } = useAuth();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");
    const currentSort = searchParams.get("sort");
    const currentView = searchParams.get("view");
    const [categories, setCategories] = useState<ForumCategory[]>([]);

    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

    return (
        <div className="w-64 shrink-0 hidden md:block space-y-8">
            {/* Main Navigation */}
            <div className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                    Menu
                </h3>
                {mainNav.map((item) => {
                    const isActive =
                        (item.name === "All Discussions" && !currentSort && !currentView && !currentCategory) ||
                        (item.name === "Popular" && currentSort === "hot") ||
                        (item.name === "My Bookmarks" && currentView === "bookmarks");

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Categories */}
            <div className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                    Categories
                </h3>
                {categories.map((cat) => {
                    const isActive = currentCategory === cat.slug;
                    const Icon = ICON_MAP[cat.slug.toLowerCase()] || Hash;

                    return (
                        <Link
                            key={cat.slug}
                            href={`/forum?category=${cat.slug}`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                            {cat.name}
                            {cat.is_restricted && (
                                <span className="ml-auto text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded-full border border-slate-700">
                                    VIP
                                </span>
                            )}
                        </Link>
                    );
                })}

            </div>

            {/* Admin Link */}
            {(profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'event_analyst') && (
                <div className="space-y-1">
                    <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                        Admin
                    </h3>
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Administration
                    </Link>
                </div>
            )}
        </div>
    );
}
