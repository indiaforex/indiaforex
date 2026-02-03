'use server';

import { createClient } from "@/lib/supabase/server";
import { AppQueue, QUEUE_NAMES } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { Queue } from 'bullmq';
import { redisConnection } from "@/lib/redis";

// Reuse the Queue instance connection for checking status
const computeQueue = new Queue(QUEUE_NAMES.COMPUTE, { connection: redisConnection });

// --- Backtester ---

export async function submitBacktest(data: {
    symbol: string,
    strategy: string,
    initialCapital: number,
    timeframe?: string,
    startDate?: string,
    endDate?: string,
    fastPeriod?: number,
    slowPeriod?: number,
    tradingStartHour?: number,
    tradingEndHour?: number,
    rsiPeriod?: number,
    rsiOverbought?: number,
    rsiOversold?: number
}) {
    try {
        const job = await AppQueue.dispatch(
            QUEUE_NAMES.COMPUTE,
            'backtest',
            data
        );
        return { success: true, jobId: job.id };
    } catch (e) {
        console.error("Backtest Error:", e);
        return { success: false, message: "Failed to submit backtest" };
    }
}

export async function getBacktestStatus(jobId: string) {
    try {
        const job = await computeQueue.getJob(jobId);
        if (!job) return { status: 'not_found' };

        const state = await job.getState();
        const result = job.returnvalue;

        return { status: state, result };
    } catch (e) {
        return { status: 'error' };
    }
}

// --- Alerts ---

export async function getAlerts() {
    const supabase = await createClient();
    const { data } = await supabase.from('user_alerts').select('*').order('created_at', { ascending: false });
    return data || [];
}

export async function createAlert(data: { symbol: string, condition: 'ABOVE' | 'BELOW', targetPrice: number }) {
    const supabase = await createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { error } = await supabase.from('user_alerts').insert({
        user_id: user.id,
        symbol: data.symbol,
        condition: data.condition,
        target_price: data.targetPrice,
        status: 'ACTIVE'
    });

    if (error) return { success: false, message: error.message };

    revalidatePath('/quant');
    return { success: true };
}

export async function deleteAlert(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('user_alerts').delete().eq('id', id);

    if (error) return { success: false, message: error.message };

    revalidatePath('/quant');
    return { success: true };
}
