'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Import logAdminAction dynamically or statically if circular deps allow. 
// Ideally move logAdminAction to a shared 'audit' lib if circular dep issues arise, 
// but currently admin.ts depends on nothing major so it should be fine.
import { logAdminAction } from "@/lib/actions/admin";

export async function createMarket(data: {
    symbol: string;
    targetDate: string;
    openPrice: number;
    question?: string;
    betConfig?: {
        presets: number[];
        allow_custom: boolean;
        min: number;
        max: number;
    };
}) {
    const supabase = await createClient();

    // 1. Auth Check (Admin Only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, message: "Forbidden: Admin Access Required" };
    }

    // 2. Insert Market
    const { data: inserted, error } = await supabase.from('prediction_markets' as any).insert({
        symbol: data.symbol,
        target_date: data.targetDate,
        open_price: data.openPrice,
        question: data.question || `Will ${data.symbol} close above ${data.openPrice}?`,
        status: 'OPEN',
        bet_config: data.betConfig || {
            presets: [100, 500, 1000],
            allow_custom: true,
            min: 1,
            max: 10000
        }
    }).select().single();

    if (error) {
        console.error("Create Market Error:", error);
        return { success: false, message: "Database Error" };
    }

    // 3. Log Admin Action
    const insertedData = inserted as any;
    await logAdminAction('CREATE_MARKET', insertedData?.id || null, {
        symbol: data.symbol,
        targetDate: data.targetDate,
        question: data.question
    });

    revalidatePath('/admin/predictions');
    revalidatePath('/'); // Update Dashboard too
    return { success: true, message: "Market Created Successfully" };
}


export async function cancelMarket(marketId: string) {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, message: "Forbidden" };
    }

    // 2. Cancel Market
    const { error } = await supabase
        .from('prediction_markets' as any)
        .update({ status: 'CANCELLED' })
        .eq('id', marketId);

    if (error) return { success: false, message: "Failed to Cancel" };

    // 3. Log Action
    await logAdminAction('DELETE_CONTENT', marketId, { type: 'prediction_market', action: 'CANCELLED' });

    revalidatePath('/admin/predictions');
    return { success: true, message: "Market Cancelled" };
}
