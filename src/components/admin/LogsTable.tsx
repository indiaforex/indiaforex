"use client";

import { useState, useEffect } from "react";
import { getAdminLogs } from "@/lib/moderation";
import { AdminLog } from "@/types/forum";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function LogsTable() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await getAdminLogs();
        setLogs(data);
        setLoading(false);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="rounded-md border border-slate-700 bg-slate-900/50">
            <table className="w-full caption-bottom text-sm text-slate-300">
                <thead className="[&_tr]:border-b [&_tr]:border-slate-700">
                    <tr className="border-b transition-colors hover:bg-slate-900/50">
                        <th className="h-12 px-4 text-left font-medium text-slate-400">Admin</th>
                        <th className="h-12 px-4 text-left font-medium text-slate-400">Action</th>
                        <th className="h-12 px-4 text-left font-medium text-slate-400">Target ID</th>
                        <th className="h-12 px-4 text-left font-medium text-slate-400">Details</th>
                        <th className="h-12 px-4 text-left font-medium text-slate-400">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                            <td className="p-4">{log.admin?.username || 'Unknown'}</td>
                            <td className="p-4 font-mono text-xs">{log.action}</td>
                            <td className="p-4 font-mono text-xs text-slate-500">{log.target_id?.substring(0, 8)}...</td>
                            <td className="p-4 max-w-xs truncate text-xs text-slate-400">
                                {JSON.stringify(log.details)}
                            </td>
                            <td className="p-4 text-slate-500">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
