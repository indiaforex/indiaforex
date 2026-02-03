'use client';

import { useState, useEffect } from 'react';
import { getSystemHealth } from '@/lib/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, Server, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SystemHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const data = await getSystemHealth();
            setHealth(data);
        } catch (error) {
            toast.error('Failed to load system health');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!health) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Health</h1>
                    <p className="text-slate-400">Real-time status of infrastructure and queues.</p>
                </div>
                <Button onClick={fetchHealth} variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Database */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Database (Supabase)</CardTitle>
                        <Database className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white mb-1">
                            {health.database.status === 'online' ? (
                                <span className="text-emerald-400">Online</span>
                            ) : (
                                <span className="text-red-400">Error</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">Latency: {health.database.latency}ms</p>
                    </CardContent>
                </Card>

                {/* Redis */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Redis Cache</CardTitle>
                        <Server className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white mb-1">
                            {health.redis.status === 'online' ? (
                                <span className="text-emerald-400">Online</span>
                            ) : (
                                <span className="text-red-400">Offline</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">Latency: {health.redis.latency}ms</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Background Workers (Queues)</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {health.queues.map((queue: any) => (
                    <Card key={queue.name} className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-slate-200 flex justify-between">
                                {queue.name}
                                {queue.status === 'online' ? (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">Active</Badge>
                                ) : (
                                    <Badge variant="destructive">Offline</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {queue.status === 'online' ? (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500 text-xs">Active</span>
                                        <span className="text-white font-mono font-bold">{queue.counts.active}</span>
                                    </div>
                                    <div className="flex flex-col p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500 text-xs">Completed</span>
                                        <span className="text-emerald-400 font-mono font-bold">{queue.counts.completed}</span>
                                    </div>
                                    <div className="flex flex-col p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500 text-xs">Failed</span>
                                        <span className="text-red-400 font-mono font-bold">{queue.counts.failed}</span>
                                    </div>
                                    <div className="flex flex-col p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500 text-xs">Delayed</span>
                                        <span className="text-amber-400 font-mono font-bold">{queue.counts.delayed}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-red-400 text-sm">{queue.error}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
