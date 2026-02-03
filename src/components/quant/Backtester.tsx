'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { submitBacktest, getBacktestStatus } from '@/lib/actions/quant';
import { toast } from 'sonner';
import { PlayCircle, Loader2, TrendingUp, RefreshCw, DollarSign, BarChart2, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

export function Backtester() {
    const [symbol, setSymbol] = useState("^NSEI");
    const [capital, setCapital] = useState("100000");
    const [timeframe, setTimeframe] = useState("1d");
    const [startDate, setStartDate] = useState("2023-01-01");
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [fastPeriod, setFastPeriod] = useState("50");
    const [slowPeriod, setSlowPeriod] = useState("200");
    const [startHour, setStartHour] = useState("9");
    const [endHour, setEndHour] = useState("15");
    const [strategy, setStrategy] = useState("SMA_CROSS");
    const [loading, setLoading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [result, setResult] = useState<any | null>(null);

    // Polling Effect
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            const status = await getBacktestStatus(jobId);

            if (status.status === 'completed' && status.result) {
                setResult(status.result);
                setJobId(null);
                setLoading(false);
                toast.success("Backtest Complete");
            } else if (status.status === 'failed' || status.status === 'error') {
                setJobId(null);
                setLoading(false);
                toast.error("Backtest Failed");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [jobId]);

    // Auto-adjust start date based on timeframe to prevent errors
    useEffect(() => {
        const today = new Date();
        let daysToSubtract = 365 * 2; // Default 2 years for Daily

        if (timeframe === '1h') {
            daysToSubtract = 700; // Max 730
        } else if (timeframe === '15m') {
            daysToSubtract = 55; // Max 60
        }

        const newStartDate = new Date(today.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
        setStartDate(newStartDate.toISOString().split('T')[0]);
    }, [timeframe]);

    const handleRun = async () => {
        if (!symbol || !capital) {
            toast.error("Please fill in all fields");
            return;
        }

        // Grab RSI params from DOM for now to avoid 3 more state variables
        const rsiPeriodInput = document.getElementById('rsiPeriod') as HTMLInputElement;
        const rsiObInput = document.getElementById('rsiOverbought') as HTMLInputElement;
        const rsiOsInput = document.getElementById('rsiOversold') as HTMLInputElement;

        setLoading(true);
        setResult(null);

        const res = await submitBacktest({
            symbol,
            strategy,
            initialCapital: parseFloat(capital),
            timeframe,
            startDate,
            endDate,
            fastPeriod: parseInt(fastPeriod),
            slowPeriod: parseInt(slowPeriod),
            tradingStartHour: parseInt(startHour),
            tradingEndHour: parseInt(endHour),
            // Optional RSI params
            rsiPeriod: rsiPeriodInput ? parseInt(rsiPeriodInput.value) : undefined,
            rsiOverbought: rsiObInput ? parseInt(rsiObInput.value) : undefined,
            rsiOversold: rsiOsInput ? parseInt(rsiOsInput.value) : undefined,
        });

        if (res.success && res.jobId) {
            setJobId(res.jobId);
            toast.info("Backtest Started...");
        } else {
            setLoading(false);
            toast.error(res.message);
        }
    };

    return (

        <div className="space-y-8">
            {/* Control Panel */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BarChart2 className="w-32 h-32 text-purple-500" />
                </div>

                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">1</span>
                    Configure Simulation
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    {/* Symbol */}
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Symbol (Yahoo)</label>
                        <Input
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="bg-slate-950 border-slate-700 h-11 focus-visible:ring-purple-500 font-mono"
                            placeholder="^NSEI"
                        />
                    </div>

                    {/* Capital */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Initial Capital (INR)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-500">₹</span>
                            <Input
                                value={capital}
                                onChange={(e) => setCapital(e.target.value)}
                                type="number"
                                className="bg-slate-950 border-slate-700 h-11 pl-7 focus-visible:ring-purple-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Timeframe */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeframe</label>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="w-full h-11 bg-slate-950 border border-slate-700 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="1d">Daily (1D)</option>
                            <option value="1h">Hourly (1H)</option>
                            <option value="15m">15 Minutes (15m)</option>
                        </select>
                    </div>

                    {/* Custom Button Position */}
                    <div className="flex items-end col-span-2 md:col-span-1">
                        <Button
                            onClick={handleRun}
                            disabled={loading}
                            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                            Run Simulation
                        </Button>
                    </div>
                </div>

                {/* Advanced Settings Divider */}
                <div className="my-6 border-t border-slate-800/50" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    {/* Date Range */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-950 border-slate-700 h-10 text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-950 border-slate-700 h-10 text-xs"
                        />
                    </div>

                    {/* Strategy Selection */}
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Strategy</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full h-11 bg-slate-950 border border-slate-700 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="SMA_CROSS">SMA Crossover</option>
                            <option value="RSI_STRATEGY">RSI Reversal</option>
                            <option value="BOLLINGER_BANDS">Bollinger Bands</option>
                        </select>
                    </div>

                    {/* Strategy Params (Dynamic) */}
                    {strategy === 'SMA_CROSS' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fast MA</label>
                                <Input
                                    type="number"
                                    value={fastPeriod}
                                    onChange={(e) => setFastPeriod(e.target.value)}
                                    className="bg-slate-950 border-slate-700 h-10 text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Slow MA</label>
                                <Input
                                    type="number"
                                    value={slowPeriod}
                                    onChange={(e) => setSlowPeriod(e.target.value)}
                                    className="bg-slate-950 border-slate-700 h-10 text-xs"
                                />
                            </div>
                        </>
                    )}

                    {strategy === 'RSI_STRATEGY' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RSI Period</label>
                                <Input
                                    type="number"
                                    defaultValue="14"
                                    id="rsiPeriod"
                                    className="bg-slate-950 border-slate-700 h-10 text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overbought / Sold</label>
                                <div className="flex gap-2">
                                    <Input type="number" defaultValue="70" id="rsiOverbought" className="bg-slate-950 border-slate-700 h-10 text-xs" placeholder="OB" />
                                    <Input type="number" defaultValue="30" id="rsiOversold" className="bg-slate-950 border-slate-700 h-10 text-xs" placeholder="OS" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Intraday Settings (Conditional) */}
                {(timeframe === '1h' || timeframe === '15m') && (
                    <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Trading Window (UTC/Market Time)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Start Hour (0-23)</label>
                                <Input
                                    type="number"
                                    min="0" max="23"
                                    value={startHour}
                                    onChange={(e) => setStartHour(e.target.value)}
                                    id="startHour"
                                    className="bg-slate-950 border-purple-500/20 h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">End Hour (0-23)</label>
                                <Input
                                    type="number"
                                    min="0" max="23"
                                    value={endHour}
                                    onChange={(e) => setEndHour(e.target.value)}
                                    id="endHour"
                                    className="bg-slate-950 border-purple-500/20 h-9 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Execution Button */}
                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={handleRun}
                        disabled={loading}
                        className={cn(
                            "w-full md:w-auto px-8 h-12 font-bold tracking-wide transition-all text-base",
                            loading
                                ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20"
                        )}
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Backtest...</>
                        ) : (
                            <><PlayCircle className="w-5 h-5 mr-2" /> Run Strategy</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Results Area */}
            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">2</span>
                            Simulation Results
                        </h2>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                {timeframe.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                                Verified
                            </Badge>
                        </div>
                    </div>

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ResultCard
                            label="Total Return"
                            value={result.metrics.totalReturn}
                            icon={TrendingUp}
                            color={result.metrics.totalReturn.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}
                            subtext="vs Buy & Hold"
                        />
                        <ResultCard
                            label="Profit Factor"
                            value={result.metrics.profitFactor || 'N/A'}
                            icon={DollarSign}
                            color="text-yellow-400"
                        />
                        <ResultCard
                            label="Win Rate"
                            value={result.metrics.winRate || 'N/A'}
                            icon={BarChart2}
                            color="text-blue-400"
                        />
                        <ResultCard
                            label="Max Drawdown"
                            value={result.metrics.maxDrawdown || 'N/A'}
                            icon={TrendingDown}
                            color="text-rose-400"
                        />
                    </div>

                    {/* Final Equity Large Card */}
                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Final Portfolio Value</p>
                            <p className="text-3xl font-bold text-white tracking-tight mt-1">₹{result.metrics.finalEquity.toLocaleString()}</p>
                        </div>
                        <div className={`text-right ${parseInt(result.metrics.totalReturn) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <p className="text-sm font-medium">Net Profit</p>
                            <p className="text-xl font-bold">{(result.metrics.finalEquity - parseFloat(capital)).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl h-[450px] relative">
                        {/* ... chart content ... */}
                        <h3 className="text-sm font-medium text-slate-400 mb-6 flex items-center gap-2">
                            <LineChart className="w-4 h-4" />
                            Equity Curve
                        </h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={result.equityCurve}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#475569"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(val) => val.slice(0, 10)}
                                    minTickGap={50}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fontSize: 11 }}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#020617',
                                        borderColor: '#1e293b',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Equity']}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="equity"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorEquity)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Trade History Table */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800">
                            <h3 className="text-sm font-medium text-white">Trade History</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950/50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3 text-right">PnL</th>
                                        <th className="px-4 py-3 text-right">Equity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {result.trades.map((trade: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-300">
                                                {trade.date.replace('T', ' ').slice(0, 16)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0 h-5 border-0",
                                                        trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                                    )}
                                                >
                                                    {trade.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-300">
                                                {trade.price.toFixed(2)}
                                            </td>
                                            <td className={cn("px-4 py-3 text-right font-mono font-bold", trade.profit > 0 ? "text-emerald-400" : trade.profit < 0 ? "text-rose-400" : "text-slate-500")}>
                                                {trade.profit ? trade.profit.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-300">
                                                {Math.round(trade.equity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

function ResultCard({ label, value, icon: Icon, color, subtext }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl transition-all hover:bg-slate-900/70 hover:border-slate-700">
            <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                {Icon && <Icon className={cn("w-4 h-4 opacity-50", color)} />}
            </div>
            <div className="flex items-baseline gap-2">
                <p className={cn("text-2xl font-bold font-mono tracking-tight", color)}>{value}</p>
            </div>
            {subtext && <p className="text-[10px] text-slate-600 mt-1">{subtext}</p>}
        </div>
    );
}
