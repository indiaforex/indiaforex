"use client";

import { useAuth } from "@/context/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsTable } from "@/components/admin/ReportsTable";
import { UsersTable } from "@/components/admin/UsersTable";
import { LogsTable } from "@/components/admin/LogsTable";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ModerationPage() {
    const { user, profile, isLoading } = useAuth();

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;

    if (!user || (profile?.role !== 'admin' && profile?.role !== 'super_admin')) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-4">
                <ShieldAlert className="h-16 w-16 text-red-900 mb-4" />
                <h1 className="text-2xl font-bold text-slate-200 mb-2">Access Restricted</h1>
                <p className="mb-6 text-center max-w-md">You do not have permission to view the moderation dashboard. This area is restricted to administrators.</p>
                <Link href="/forum">
                    <Button variant="outline">Return to Forum</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Moderation Dashboard</h1>
                        <p className="text-slate-400">Manage reports, users, and review activity logs.</p>
                    </div>
                </div>

                <Tabs defaultValue="reports" className="w-full">
                    <TabsList className="bg-slate-900 border border-slate-800">
                        <TabsTrigger value="reports" className="data-[state=active]:bg-slate-800">Reports</TabsTrigger>
                        <TabsTrigger value="users" className="data-[state=active]:bg-slate-800">Users</TabsTrigger>
                        <TabsTrigger value="logs" className="data-[state=active]:bg-slate-800">Audit Logs</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="reports" className="space-y-4 overflow-x-auto pb-4">
                            <ReportsTable />
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4 overflow-x-auto pb-4">
                            <UsersTable />
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-4 overflow-x-auto pb-4">
                            <LogsTable />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
