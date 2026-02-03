import { createClient } from "@/lib/supabase/server";
import { MarketManager } from "@/components/admin/MarketManager";
import { redirect } from "next/navigation";

export default async function AdminPredictionsPage() {
    const supabase = await createClient();

    // 1. Admin Guard
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold">Unauthorized</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    // 2. Fetch Data
    const { data: markets } = await supabase
        .from('prediction_markets' as any)
        .select('*')
        .order('target_date', { ascending: false });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Prediction Manager</h1>
                        <p className="text-slate-400">Manage daily prediction markets.</p>
                    </div>
                    <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded text-slate-500">
                        Role: {profile.role}
                    </div>
                </div>

                <MarketManager initialMarkets={markets as any || []} />
            </div>
        </div>
    );
}
