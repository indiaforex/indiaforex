import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAlerts } from "@/lib/actions/quant";
import { BrainCircuit, LineChart, Bell, ExternalLink, Zap } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { getMarketData } from "@/lib/market";

const Backtester = dynamic(() => import("@/components/quant/Backtester").then(mod => mod.Backtester));
const AlertManager = dynamic(() => import("@/components/quant/AlertManager").then(mod => mod.AlertManager));
const MarketTicker = dynamic(() => import("@/components/dashboard/MarketTicker"));

export const metadata = {
    title: 'Quant Workspace | Titan',
    description: 'Advanced market analysis and alerts.'
};

export default async function QuantPage() {
    const alerts = await getAlerts();
    const marketData = await getMarketData();

    return (
        <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
            <Header />

            {/* Mobile Ticker */}
            <div className="md:hidden">
                <MarketTicker initialData={marketData} />
            </div>

            <div className="container mx-auto max-w-6xl px-4 lg:px-8 py-8">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <BrainCircuit className="h-6 w-6 text-purple-400" />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Quant Workspace
                            </span>
                        </h1>
                        <p className="text-slate-400 mt-2 max-w-lg text-sm leading-relaxed">
                            Develop and backtest algorithmic strategies with institutional-grade logic.
                            Monitor markets with real-time server-side alerts.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Titan Engine v1.0 Active
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Workspace (8 cols) */}
                    <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-1 shadow-2xl">
                            <Tabs defaultValue="backtest" className="w-full">
                                <div className="px-1 pt-1 mb-6">
                                    <TabsList className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl w-full grid grid-cols-2 h-12">
                                        <TabsTrigger
                                            value="backtest"
                                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-sm font-medium transition-all duration-300"
                                        >
                                            <LineChart className="w-4 h-4 mr-2" /> Insta-Backtest
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="alerts"
                                            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg text-sm font-medium transition-all duration-300"
                                        >
                                            <Bell className="w-4 h-4 mr-2" /> Smart Watch
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="px-4 pb-4 min-h-[500px]">
                                    <TabsContent value="backtest" className="mt-0 focus-visible:ring-0">
                                        <Backtester />
                                    </TabsContent>

                                    <TabsContent value="alerts" className="mt-0 focus-visible:ring-0">
                                        {/* Cast active alerts to any to bypass strict type check for now */}
                                        <AlertManager initialAlerts={alerts as any[]} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right Panel (4 cols) */}
                    <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-6 duration-700 delay-200">

                        {/* Premium Ad Component */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F19]">
                            {/* Gloss effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="p-1">
                                <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                                    <div className="absolute bottom-0 left-0 right-0 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur-md">PRO</span>
                                            <span className="text-slate-300 text-xs font-mono tracking-wider">TITAN TERMINAL</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white leading-tight mb-2">
                                            Institutional Data. <br />
                                            <span className="text-blue-400">Zero Latency.</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                                            Connect directly to exchange APIs via our dedicated fiber lines. Get the edge you deserve.
                                        </p>
                                        <Button size="sm" className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs h-9">
                                            Get Early Access <Zap className="w-3 h-3 ml-2 fill-slate-950" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips Widget */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 backdrop-blur-sm">
                            <h3 className="flex items-center gap-2 font-bold text-slate-200 text-sm mb-4">
                                <BrainCircuit className="h-4 w-4 text-emerald-500" />
                                Quant Insights
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-xs text-slate-400 group">
                                    <div className="h-full pt-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-purple-500 transition-colors" />
                                    </div>
                                    <span className="leading-relaxed">
                                        <strong className="text-slate-300">SMA Crossover:</strong> A foundational trend-following strategy. Best used on daily (1D) timeframes for forex pairs.
                                    </span>
                                </li>
                                <li className="flex gap-3 text-xs text-slate-400 group">
                                    <div className="h-full pt-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors" />
                                    </div>
                                    <span className="leading-relaxed">
                                        <strong className="text-slate-300">Alerts Latency:</strong> Server checks prices every 60s. For HFT, use the Pro API.
                                    </span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
