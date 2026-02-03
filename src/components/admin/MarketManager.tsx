'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";
import { createMarket, cancelMarket } from "@/lib/actions/admin-market";

interface Market {
    id: string;
    symbol: string;
    target_date: string;
    open_price: number;
    status: string;
}

export function MarketManager({ initialMarkets }: { initialMarkets: Market[] }) {
    const [markets, setMarkets] = useState<Market[]>(initialMarkets);
    const [loading, setLoading] = useState(false);

    // Form State
    const [symbol, setSymbol] = useState("USDINR=X");
    const [date, setDate] = useState("");
    const [price, setPrice] = useState("");
    const [question, setQuestion] = useState("");
    const [presets, setPresets] = useState("100, 500, 1000");
    const [allowCustom, setAllowCustom] = useState(true);

    const handleCreate = async () => {
        if (!symbol || !date || !price) {
            toast.error("Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await createMarket({
                symbol,
                targetDate: date,
                openPrice: parseFloat(price),
                question,
                betConfig: {
                    presets: presets.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n)),
                    allow_custom: allowCustom,
                    min: 1,
                    max: 10000
                }
            });

            if (res.success) {
                toast.success("Market Created");
                // Optimistic update or refresh handled by parent/props usually, 
                // but since this is client component with initial data props, 
                // we might need router.refresh() or just wait for revalidation.
                // For simplicity, we just clear form.
                setSymbol("USDINR=X");
                setPrice("");
                setQuestion("");
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Error creating market");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const res = await cancelMarket(id);
        if (res.success) toast.success("Market Cancelled");
        else toast.error("Failed");
    };

    return (
        <div className="space-y-8">
            {/* Create Market Form */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-6">
                <h3 className="text-lg font-medium text-emerald-400 border-b border-slate-800 pb-2">Create New Market</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Symbol (Yahoo)</label>
                        <Input
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="e.g. USDINR=X"
                            className="bg-slate-950 border-slate-800"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Target Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-950 border-slate-800"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Open Price</label>
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="bg-slate-950 border-slate-800"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs text-slate-500 mb-1 block">Question (Optional Topic)</label>
                        <Input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. Will USD/INR close above 83.50?"
                            className="bg-slate-950 border-slate-800"
                        />
                    </div>

                    {/* Betting Config */}
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-2">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Presets (comma separated)</label>
                            <Input
                                value={presets}
                                onChange={(e) => setPresets(e.target.value)}
                                placeholder="100, 500, 1000"
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="allowCustom"
                                checked={allowCustom}
                                onChange={(e) => setAllowCustom(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
                            />
                            <label htmlFor="allowCustom" className="text-sm text-slate-300 select-none cursor-pointer">Allow Custom Amounts</label>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                        {loading ? 'Creating...' : 'Create Market'}
                    </Button>
                </div>
            </div>

            {/* Active Markets List */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-medium text-emerald-400 border-b border-slate-800 pb-2">Active Markets</h3>

                <div className="overflow-hidden rounded-md border border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-950">
                            <TableRow className="hover:bg-transparent border-slate-800">
                                <TableHead className="text-xs font-medium text-slate-400">Date</TableHead>
                                <TableHead className="text-xs font-medium text-slate-400">Symbol</TableHead>
                                <TableHead className="text-xs font-medium text-slate-400">Open Price</TableHead>
                                <TableHead className="text-xs font-medium text-slate-400">Status</TableHead>
                                <TableHead className="text-xs font-medium text-slate-400 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {markets.map((m) => (
                                <TableRow key={m.id} className="border-slate-800 hover:bg-slate-900/50 bg-slate-950/30">
                                    <TableCell className="font-mono text-xs text-slate-300">{m.target_date}</TableCell>
                                    <TableCell className="font-bold text-sm text-slate-200">{m.symbol}</TableCell>
                                    <TableCell className="font-mono text-sm text-slate-300">{m.open_price}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={m.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}>
                                            {m.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {m.status === 'OPEN' && (
                                            <Button size="sm" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleCancel(m.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {markets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                                        No active markets found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
