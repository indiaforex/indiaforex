'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from "lucide-react";

interface BetHistoryProps {
    bets: any[];
}

export function BetHistory({ bets }: BetHistoryProps) {
    if (!bets || bets.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 text-sm">
                No bets placed yet. Start predicting!
            </div>
        );
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Prediction</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bets.map((bet) => (
                        <TableRow key={bet.id} className="border-slate-800 hover:bg-slate-900/50">
                            <TableCell className="text-xs text-slate-400">
                                {format(new Date(bet.created_at), 'MMM dd')}
                            </TableCell>
                            <TableCell className="font-medium text-xs">
                                {bet.prediction_markets?.symbol || 'Unknown'}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`
                                    text-[10px] gap-1 border-0
                                    ${bet.direction === 'UP' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
                                `}>
                                    {bet.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {bet.direction}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                                {bet.amount}
                            </TableCell>
                            <TableCell className="text-right">
                                {bet.status === 'PENDING' && (
                                    <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400">
                                        <Clock className="w-3 h-3 mr-1" /> Pending
                                    </Badge>
                                )}
                                {bet.status === 'WON' && (
                                    <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> +{(bet.amount * 2)}
                                    </Badge>
                                )}
                                {bet.status === 'LOST' && (
                                    <Badge variant="destructive" className="text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-0">
                                        <XCircle className="w-3 h-3 mr-1" /> Lost
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
