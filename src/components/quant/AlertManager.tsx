'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAlert, deleteAlert } from "@/lib/actions/quant";
import { toast } from "sonner";
import { BellRing, Trash2, TrendingUp, TrendingDown, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Alert {
    id: string;
    symbol: string;
    condition: 'ABOVE' | 'BELOW';
    target_price: number;
    status: string;
    created_at: string;
}

export function AlertManager({ initialAlerts }: { initialAlerts: Alert[] }) {
    const [symbol, setSymbol] = useState("USDINR=X");
    const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!price || !symbol) {
            toast.error("Please fill in all details");
            return;
        }
        setLoading(true);
        const res = await createAlert({
            symbol,
            condition,
            targetPrice: parseFloat(price)
        });
        setLoading(false);

        if (res.success) {
            toast.success("Alert Set Successfully");
            setPrice("");
        } else {
            toast.error(res.message);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteAlert(id);
        if (res.success) toast.success("Alert Deleted");
        else toast.error("Failed to delete");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Create Form (4 cols) */}
            <div className="md:col-span-4 space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl sticky top-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <BellRing className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-200">New Alert</h3>
                            <p className="text-xs text-slate-500">Monitor price levels 24/7</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Symbol</label>
                            <Input
                                value={symbol}
                                onChange={e => setSymbol(e.target.value)}
                                className="bg-slate-950 border-slate-700 focus-visible:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Condition</label>
                                <Select value={condition} onValueChange={(v: any) => setCondition(v)}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                        <SelectItem value="ABOVE">Above</SelectItem>
                                        <SelectItem value="BELOW">Below</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Target</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="bg-slate-950 border-slate-700 focus-visible:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 mt-2"
                        >
                            {loading ? "Setting Alert..." : "Create Alert"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Active Alerts List (8 cols) */}
            <div className="md:col-span-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Active Alerts</h3>
                    <Badge variant="outline" className="border-slate-800 text-slate-500">
                        {initialAlerts.length} Active
                    </Badge>
                </div>

                {initialAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <div className="p-4 bg-slate-900 rounded-full mb-3">
                            <CircleDashed className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium">No active alerts</p>
                        <p className="text-xs text-slate-600 mt-1 max-w-xs text-center">Set your first price alert to get notified when markets move.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {initialAlerts.map(alert => (
                            <div key={alert.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/80 hover:border-slate-700 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${alert.condition === 'ABOVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                        }`}>
                                        {alert.condition === 'ABOVE' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-lg text-slate-200">{alert.symbol}</span>
                                            <span className="text-xs font-mono text-slate-500">
                                                {new Date(alert.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-400 flex items-center gap-2">
                                            <span>Alert if price goes</span>
                                            <span className={`font-bold ${alert.condition === 'ABOVE' ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                {alert.condition}
                                            </span>
                                            <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-white border border-slate-800">
                                                {alert.target_price}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={
                                        alert.status === 'TRIGGERED'
                                            ? 'text-orange-400 border-orange-400/20 bg-orange-400/5'
                                            : 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                                    }>
                                        {alert.status}
                                    </Badge>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDelete(alert.id)}
                                        className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
