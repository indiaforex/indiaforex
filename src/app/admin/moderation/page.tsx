'use client';

import { useState, useEffect } from 'react';
import { getReports, resolveReport, deleteReportedContent } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ModerationPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { reports: data } = await getReports(1, 100); // Fetch mostly recent
            setReports(data);
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleResolve = async (id: string, resolution: 'resolved' | 'dismissed') => {
        try {
            await resolveReport(id, resolution);
            toast.success(`Report ${resolution}`);
            fetchReports();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (report: any) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this content?")) return;

        try {
            await deleteReportedContent(report.id, report.target_type, report.target_id);
            toast.success("Content deleted and report resolved.");
            fetchReports();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
                <p className="text-slate-400">Review and resolve user reports.</p>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center p-12 bg-slate-900 rounded-lg border border-slate-800 text-slate-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500/50" />
                        <h3 className="text-lg font-medium text-slate-300">All caught up!</h3>
                        <p>No pending reports found.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <Card key={report.id} className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base font-medium text-slate-200">
                                    <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'} className="mr-2">
                                        {report.status.toUpperCase()}
                                    </Badge>
                                    Report on {report.target_type}
                                </CardTitle>
                                <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</span>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                        <p className="text-sm text-slate-300 font-mono">{report.content_preview}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Reported by: <span className="text-white">{report.reporter?.username || 'Unknown'}</span></span>
                                        <span className="text-red-400 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Reason: {report.reason}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2 pt-0">
                                {report.status === 'pending' && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => handleResolve(report.id, 'dismissed')} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Dismiss
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(report)}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Content
                                        </Button>
                                        <Button variant="default" size="sm" onClick={() => handleResolve(report.id, 'resolved')} className="bg-emerald-600 hover:bg-emerald-700">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Resolve (Keep)
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
