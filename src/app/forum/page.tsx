import { getThreads, getBookmarkedThreads, getRecentThreads } from "@/lib/forum";
import { ForumHighlights } from "@/components/forum/ForumHighlights";
import { CreateThreadModal } from "@/components/forum/CreateThreadModal";
import { ForumSidebar } from "@/components/forum/ForumSidebar";
import MarketTicker from "@/components/dashboard/MarketTicker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = {
    searchParams: Promise<{ search?: string; category?: string; page?: string; sort?: 'latest' | 'top' | 'hot'; view?: string }>;
};

export default async function ForumIndexPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || "";
    const category = params.category || "all";
    const sort = params.sort || "latest";
    const view = params.view;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let threads: any[] = [];
    let total = 0;

    if (view === 'bookmarks' && user) {
        // Fetch Bookmarks
        threads = await getBookmarkedThreads(user.id);
        total = threads.length;
        // Client-side pagination for bookmarks or just show all for now (MVP)
        // Bookmarks usually aren't paginated heavily in MVPs.
    } else {
        // Standard Fetch
        const result = await getThreads({ page, limit: 10, search, category, sort });
        threads = result.threads;
        total = result.total;
    }

    const totalPages = Math.ceil(total / 10);

    return (
        <div className="flex gap-8">
            {/* Left Sidebar */}
            <ForumSidebar />

            {/* Main Feed */}
            <div className="flex-1 min-w-0 space-y-6">

                {/* Mobile-Only Market Ticker */}
                <div className="md:hidden -mx-4 -mt-2 mb-2">
                    <MarketTicker />
                </div>

                {/* Header / Mobile Action */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                        {view === 'bookmarks' ? 'My Bookmarks' :
                            category !== 'all' ? `${category} Discussions` :
                                sort === 'hot' ? 'Popular Discussions' : 'Market Board'}
                    </h1>
                    <div className="md:hidden">
                        <CreateThreadModal />
                    </div>
                </div>

                {/* Tabs / Filters (Mobile only - Desktop uses Sidebar) */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
                    {/* Simplified mobile nav could go here */}
                </div>

                {/* Create Thread (Desktop) */}
                <div className="hidden md:block p-4 border border-slate-800/60 bg-slate-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-200">Start a Discussion</h2>
                            <p className="text-sm text-slate-500">Share your market analysis or ask a question.</p>
                        </div>
                        <CreateThreadModal />
                    </div>
                </div>

                {/* Content */}
                {threads.length > 0 ? (
                    <ForumHighlights threads={threads} />
                ) : (
                    <div className="text-center py-20 text-slate-500 font-mono text-sm border border-slate-800 border-dashed rounded-lg bg-slate-900/10">
                        {view === 'bookmarks'
                            ? "You haven't bookmarked any threads yet."
                            : "No discussions found. Be the first to start one!"}
                    </div>
                )}

                {/* Pagination (Only for main feed) */}
                {view !== 'bookmarks' && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-6">
                        <Link href={{ query: { ...params, page: Math.max(1, page - 1) } }} passHref legacyBehavior={false}>
                            <Button variant="outline" size="sm" disabled={page <= 1} className="gap-2">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                        </Link>
                        <span className="text-sm font-mono text-slate-400">
                            Page {page} of {totalPages}
                        </span>
                        <Link href={{ query: { ...params, page: Math.min(totalPages, page + 1) } }} passHref legacyBehavior={false}>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} className="gap-2">
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Right Panel (Highlights) */}
            <div className="w-80 shrink-0 hidden xl:block space-y-6">
                {/* Trending / Highlights Component could act as a sidebar widget */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 sticky top-24">
                    <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        Community Highlights
                    </h3>
                    <div className="space-y-4">
                        <div className="text-xs text-slate-500">
                            Top discussions and active traders appearing here soon.
                        </div>
                        {/* We could reuse ForumHighlights restricted to 'top' here or fetch separate widgets */}
                    </div>
                </div>
            </div>
        </div>
    );
}
