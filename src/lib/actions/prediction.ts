'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BetDirection = 'UP' | 'DOWN';

interface PlaceBetResult {
    success: boolean;
    message: string;
    newBalance?: number;
}

export async function placeBet(
    marketId: string,
    direction: BetDirection,
    amount: number
): Promise<PlaceBetResult> {
    const supabase = await createClient();

    try {
        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: "Use must be logged in to bet." };
        }

        if (amount <= 0) {
            return { success: false, message: "Bet amount must be positive." };
        }

        // 2. Refresh Profile (Check Balance)
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("reputation_points")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return { success: false, message: "Could not fetch user profile." };
        }

        if (profile.reputation_points < amount) {
            return {
                success: false,
                message: `Insufficient balance. You have ${profile.reputation_points} points.`
            };
        }

        // 3. Deduct Points (Optimistic Lock ideally, but simple update for MVP)
        // We do this BEFORE inserting the bet to prevent "free bets"
        const { error: deductError } = await supabase
            .from("profiles")
            .update({ reputation_points: profile.reputation_points - amount })
            .eq("id", user.id);

        if (deductError) {
            return { success: false, message: "Transaction failed: Could not deduct points." };
        }

        // 4. Place Bet
        const { error: betError } = await supabase
            .from("market_bets")
            .insert({
                user_id: user.id,
                market_id: marketId,
                direction,
                amount,
                status: 'PENDING'
            });

        if (betError) {
            // CRITICAL: Refund points if bet insertion fails
            console.error("Bet insertion failed, refunding user:", user.id, amount);
            await supabase.from("profiles")
                .update({ reputation_points: profile.reputation_points }) // Set back to original
                .eq("id", user.id);

            return { success: false, message: "Failed to place bet. Points have been refunded." };
        }

        // 5. Success
        revalidatePath("/dashboard");
        revalidatePath("/prediction-pools");

        return {
            success: true,
            message: "Bet placed successfully!",
            newBalance: profile.reputation_points - amount
        };

    } catch (err: any) {
        console.error("Place Bet Error:", err);
        return { success: false, message: "An unexpected error occurred." };
    }
}
