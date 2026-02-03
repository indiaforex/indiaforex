"use client";

import dynamic from 'next/dynamic';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { IndicesWatchlist } from "@/components/dashboard/IndicesWatchlist";
import TradersOnline from "@/components/dashboard/TradersOnline";
import { ForumHighlights } from "@/components/forum/ForumHighlights";
import { PredictionList } from "@/components/predictions/PredictionList";
import EconomicCalendar from "@/components/dashboard/EconomicCalendar";

// Dynamic Imports (Moved from page.tsx)
const MarketTicker = dynamic(() => import('@/components/dashboard/MarketTicker'), { ssr: true });
const LiveMarketScanner = dynamic(() => import('@/components/dashboard/LiveMarketScanner'));
const SectorHeatmap = dynamic(() => import('@/components/dashboard/SectorHeatmap'), {
    loading: () => <div className="h-64 bg-slate-900/50 animate-pulse rounded-xl" />,
    ssr: false
});
const NewsFeed = dynamic(() => import('@/components/dashboard/NewsFeed').then(mod => mod.NewsFeed));
const AdContainer = dynamic(() => import('@/components/dashboard/AdContainer'));

interface DashboardClientProps {
    events: any;
    threads: any;
    predictions: any;
}

export default function DashboardClient({ events, threads, predictions }: DashboardClientProps) {
    return (
        <DashboardLayout
            leftSidebar={
                <>
                    <IndicesWatchlist />
                    <SectorHeatmap />
                    <TradersOnline />
                </>
            }
            rightSidebar={
                <>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-4">
                        <NewsFeed />
                        <AdContainer />
                    </div>

                    <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                        {/* Icon omitted for brevity in match */}
                        Trending Predictions
                    </h3>
                    <PredictionList limit={3} compact predictions={predictions} />

                    {/* Footer Credits */}
                    <div className="shrink-0 border-t border-slate-800 pt-4 text-[10px] text-slate-500 font-mono space-y-2 text-center pb-2 bg-background z-10">
                        <p className="font-bold">© IndiaForex 2025</p>
                        <p>
                            Temporary build developed by <span className="text-slate-400">Shashank Anand</span> and operated by <span className="text-slate-400">Naman Arora</span>.
                        </p>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Mobile-Only Market Ticker */}
                <div className="md:hidden -mx-4 -mt-2 mb-2">
                    <MarketTicker />
                </div>

                <LiveMarketScanner />
                <PredictionList predictions={predictions} />
                <EconomicCalendar data={events} />

                {/* Mobile-Only News Feed & Heatmap */}
                <div className="md:hidden space-y-6">
                    <SectorHeatmap />
                    <NewsFeed />
                </div>

                <ForumHighlights threads={threads} />

                {/* Mobile-Only Sidebar Components */}
                <div className="md:hidden space-y-6">
                    <SectorHeatmap />
                    <TradersOnline />
                </div>

                {/* Mobile-Only Footer */}
                <div className="md:hidden border-t border-slate-800 pt-6 text-[10px] text-slate-500 font-mono space-y-2 text-center pb-8">
                    <p className="font-bold">© IndiaForex 2025</p>
                    <p>
                        Temporary build developed by <span className="text-slate-400">Shashank Anand</span> and operated by <span className="text-slate-400">Naman Arora</span>.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
