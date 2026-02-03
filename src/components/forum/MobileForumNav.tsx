"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCategories } from "@/lib/forum";
import { ForumCategory } from "@/types/forum";
import {
    LayoutDashboard,
    TrendingUp,
    Bookmark,
    Hash,
    ChevronDown
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function MobileForumNav() {
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");
    const currentSort = searchParams.get("sort");
    const currentView = searchParams.get("view");
    const [categories, setCategories] = useState<ForumCategory[]>([]);

    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

    const activeLabel =
        currentView === 'bookmarks' ? 'My Bookmarks' :
            currentSort === 'hot' ? 'Popular' :
                currentCategory ? categories.find(c => c.slug === currentCategory)?.name || 'Category' :
                    'All Discussions';

    return (
        <div className="md:hidden flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-slate-900 border-slate-800">
                        {activeLabel} <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-slate-950 border-slate-800">
                    <DropdownMenuLabel>View</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href="/forum" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> All Discussions
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/forum?sort=hot" className="cursor-pointer">
                            <TrendingUp className="mr-2 h-4 w-4" /> Popular
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/forum?view=bookmarks" className="cursor-pointer">
                            <Bookmark className="mr-2 h-4 w-4" /> My Bookmarks
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-800" />

                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                    {categories.map((cat) => (
                        <DropdownMenuItem key={cat.slug} asChild>
                            <Link href={`/forum?category=${cat.slug}`} className="cursor-pointer">
                                <Hash className="mr-2 h-4 w-4 text-slate-500" />
                                {cat.name}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Filter Pills */}
            <Link
                href="/forum?sort=hot"
                className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
                    currentSort === 'hot'
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                )}
            >
                🔥 Trending
            </Link>
            <Link
                href="/forum?category=crypto"
                className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
                    currentCategory === 'crypto'
                        ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                )}
            >
                Crypto
            </Link>
            <Link
                href="/forum?category=fno"
                className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
                    currentCategory === 'fno'
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                )}
            >
                F&O
            </Link>
        </div>
    );
}
