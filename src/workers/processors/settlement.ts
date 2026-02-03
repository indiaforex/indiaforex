import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';
import { AppQueue, QUEUE_NAMES } from '@/lib/queue';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

export async function settlementProcessor() {
    console.log('[Settlement] Checking for markets to settle...');

    // 1. Find OPEN markets that are past their target date (Target Date < Today)
    // Actually, if we bet on "Today's Close", we can settle "Tomorrow Morning" or "Late Tonight"
    // Let's settle any OPEN market where (now > target_date 17:00 IST)?
    // For simplicity: Settle any OPEN market where target_date < Current Date (Meaning yesterday's market)

    const today = new Date().toISOString().split('T')[0];

    // Fetch markets where target_date < today AND status = 'OPEN'
    const { data: markets } = await supabase
        .from('prediction_markets')
        .select('*')
        .eq('status', 'OPEN')
        .lt('target_date', today); // "Less Than Today" means it was for yesterday or older.

    if (!markets || markets.length === 0) {
        console.log('[Settlement] No pending markets to settle.');
        return;
    }

    console.log(`[Settlement] Found ${markets.length} markets to settle.`);

    for (const market of markets) {
        // 2. Determine Outcome
        // We need the CLOSE price for that target_date.
        // Yahoo Finance history API?
        const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

        let closePrice = 0;
        try {
            // Get historical data for that specific date
            // yf.historical(symbol, { period1: market.target_date, period2: market.target_date + 1 day })
            const nextDay = new Date(market.target_date);
            nextDay.setDate(nextDay.getDate() + 1);

            const history = await yf.historical(market.symbol, {
                period1: market.target_date,
                period2: nextDay.toISOString().split('T')[0],
                interval: '1d'
            });

            if (history && history.length > 0) {
                closePrice = history[0].close;
            } else {
                console.warn(`[Settlement] No history found for ${market.symbol} on ${market.target_date}`);
                continue; // Skip settlement for this one
            }

        } catch (e) {
            console.error(`[Settlement] Failed price fetch for ${market.symbol}`, e);
            continue;
        }

        const winner = closePrice > market.open_price ? 'UP' : 'DOWN';
        console.log(`[Settlement] ${market.symbol}: Open ${market.open_price} -> Close ${closePrice}. Winner: ${winner}`);

        // 3. Process Bets (Batched)
        const { data: bets } = await supabase
            .from('market_bets')
            .select('*')
            .eq('market_id', market.id)
            .eq('status', 'PENDING');

        if (bets) {
            for (const bet of bets) {
                if (bet.direction === winner) {
                    const payout = Number(bet.amount) * 2;

                    // Credit User (Atomic increment RPC would be better, but doing Read-Update for MVP)
                    const { data: profile } = await supabase.from('profiles').select('reputation_points').eq('id', bet.user_id).single();
                    if (profile) {
                        await supabase.from('profiles')
                            .update({ reputation_points: profile.reputation_points + payout })
                            .eq('id', bet.user_id);
                    }

                    // Update Bet
                    await supabase.from('market_bets').update({ status: 'WON', payout }).eq('id', bet.id);

                    // Dispatch Gamification Job
                    await AppQueue.dispatch(QUEUE_NAMES.ENGAGEMENT, 'bet-settled', {
                        type: 'BET_SETTLED',
                        userId: bet.user_id,
                        details: { won: true, amount: payout }
                    });
                } else {
                    // Update Bet
                    await supabase.from('market_bets').update({ status: 'LOST', payout: 0 }).eq('id', bet.id);

                    // Dispatch Gamification Job (Even for loss, update leaderboard if needed or track stats)
                    await AppQueue.dispatch(QUEUE_NAMES.ENGAGEMENT, 'bet-settled', {
                        type: 'BET_SETTLED',
                        userId: bet.user_id,
                        details: { won: false, amount: 0 }
                    });
                }
            }
        }

        // 4. Close Market
        await supabase.from('prediction_markets').update({
            status: 'SETTLED',
            resolution_price: closePrice,
            winner
        }).eq('id', market.id);

        console.log(`[Settlement] Settled ${market.id}`);
    }
}
