'use client';

import { useState, useEffect } from 'react';
import { getAdminLogs } from '@/lib/actions/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { logs: data } = await getAdminLogs();
                setLogs(data);
            } catch (error) {
                toast.error('Failed to load logs');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <p className="text-slate-400">Track administrative actions and security events.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-950">
                        <TableRow className="border-slate-800 hover:bg-slate-950">
                            <TableHead className="text-slate-400">Admin</TableHead>
                            <TableHead className="text-slate-400">Action</TableHead>
                            <TableHead className="text-slate-400">Details</TableHead>
                            <TableHead className="text-slate-400 text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-200">
                                        {log.admin?.username || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-300">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-md truncate text-slate-400 font-mono text-xs">
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-500 text-sm">
                                        {new Date(log.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
