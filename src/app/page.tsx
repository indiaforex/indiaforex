import MarketTicker from "@/components/dashboard/MarketTicker";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { IndicesWatchlist } from "@/components/dashboard/IndicesWatchlist";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import LiveMarketScanner from "@/components/dashboard/LiveMarketScanner";
import EconomicCalendar from "@/components/dashboard/EconomicCalendar";
import SectorHeatmap from "@/components/dashboard/SectorHeatmap";
import TradersOnline from "@/components/dashboard/TradersOnline";
import AdContainer from "@/components/dashboard/AdContainer";
import { getEvents } from "@/lib/sheetdb";
import { getRecentThreads } from "@/lib/forum";
import { ForumHighlights } from "@/components/forum/ForumHighlights";

export default async function Home() {
  const events = await getEvents();
  const threads = await getRecentThreads();

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
        <EconomicCalendar data={events} />

        {/* Mobile-Only News Feed */}
        <div className="md:hidden">
          <NewsFeed />
        </div>

        <ForumHighlights threads={threads} />

        {/* Mobile-Only Sidebar Components */}
        <div className="md:hidden space-y-6">
          <SectorHeatmap />
          <TradersOnline />
        </div>
      </div>
    </DashboardLayout>
  );
}
