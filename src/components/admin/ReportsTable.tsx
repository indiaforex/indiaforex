"use client";

import { useState, useEffect } from "react";
import { getReports, resolveReport, adminDeleteContent, banReportTargetAuthor, banUser } from "@/lib/moderation";
import { ForumReport } from "@/types/forum";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Trash2, Ban, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function ReportsTable() {
    const [reports, setReports] = useState<ForumReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const data = await getReports('pending');
        setReports(data);
        setLoading(false);
    };

    const handleAction = async (report: ForumReport, action: 'dismiss' | 'ban' | 'delete') => {
        setProcessing(report.id);
        try {
            if (action === 'dismiss') {
                await resolveReport(report.id, 'dismissed');
                toast.success("Report dismissed");
            } else if (action === 'ban') {
                if (confirm("Are you sure you want to ban the author of this content? This cannot be easily undone.")) {
                    const res = await banReportTargetAuthor(report.id);
                    if (res.error) throw new Error(res.error);
                    await resolveReport(report.id, 'resolved');
                    toast.success("User banned");
                } else {
                    setProcessing(null);
                    return;
                }
            } else if (action === 'delete') {
                await adminDeleteContent(report.target_type, report.target_id);
                await resolveReport(report.id, 'resolved');
                toast.success("Content deleted and report resolved");
            }
            // Refresh
            setReports(prev => prev.filter(p => p.id !== report.id));
        } catch (e) {
            toast.error("Action failed");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (reports.length === 0) {
        return <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-lg">No pending reports</div>;
    }

    return (
        <div className="rounded-md border border-slate-700 bg-slate-900/50">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-slate-300">
                    <thead className="[&_tr]:border-b [&_tr]:border-slate-700">
                        <tr className="border-b transition-colors hover:bg-slate-900/50 data-[state=selected]:bg-slate-900">
                            <th className="h-12 px-4 text-left align-middle font-medium text-slate-400">Reporter</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-slate-400">Type</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-slate-400">Reason</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-slate-400">Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {reports.map((report) => (
                            <tr key={report.id} className="border-b border-slate-700 transition-colors hover:bg-slate-800/50">
                                <td className="p-4 align-middle">
                                    <div className="font-medium text-slate-200">{report.reporter?.username || 'Unknown'}</div>
                                </td>
                                <td className="p-4 align-middle">
                                    <Badge variant="outline" className="capitalize">{report.target_type}</Badge>
                                    <Link href={report.target_type === 'thread' ? `/forum/thread/${report.target_id}` : `/forum?comment=${report.target_id}`} target="_blank">
                                        <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-slate-400"><ExternalLink className="h-3 w-3" /></Button>
                                    </Link>
                                </td>
                                <td className="p-4 align-middle max-w-xs truncate" title={report.reason}>
                                    {report.reason}
                                </td>
                                <td className="p-4 align-middle text-slate-500">
                                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                </td>
                                <td className="p-4 align-middle">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20"
                                            onClick={() => handleAction(report, 'dismiss')}
                                            disabled={!!processing}
                                        >
                                            {processing === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20"
                                            onClick={() => handleAction(report, 'delete')}
                                            disabled={!!processing}
                                            title="Delete Content"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-950/20"
                                            onClick={() => handleAction(report, 'ban')}
                                            disabled={!!processing}
                                            title="Ban Author"
                                        >
                                            <Ban className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
