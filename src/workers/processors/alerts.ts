import { createClient } from '@supabase/supabase-js';
import { getLatestPrice } from '@/lib/redis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

export async function alertsProcessor() {
    // 1. Fetch Active Alerts
    const { data: alerts, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('status', 'ACTIVE');

    if (!alerts || alerts.length === 0) return;

    // 2. Group by Symbol to minimize Redis calls
    const distinctSymbols = [...new Set(alerts.map(a => a.symbol))];
    const prices: Record<string, number> = {};

    // 3. Fetch Prices
    await Promise.all(distinctSymbols.map(async (sym) => {
        const price = await getLatestPrice(sym);
        if (price) prices[sym] = price;
    }));

    // 4. Check Conditions
    for (const alert of alerts) {
        const currentPrice = prices[alert.symbol];
        if (!currentPrice) continue;

        let triggered = false;

        if (alert.condition === 'ABOVE' && currentPrice >= alert.target_price) {
            triggered = true;
        } else if (alert.condition === 'BELOW' && currentPrice <= alert.target_price) {
            triggered = true;
        }

        if (triggered) {
            console.log(`[Alert] 🚨 Triggered for ${alert.symbol}: Now ${currentPrice} (${alert.condition} ${alert.target_price})`);

            // A. Send Notification (In-App)
            await supabase.from('notifications').insert({
                user_id: alert.user_id,
                actor_id: alert.user_id, // Self-notification
                type: 'mention', // Reusing existing type or add 'alert' later
                resource_id: alert.id,
                resource_slug: alert.symbol,
                content_preview: `Price Alert: ${alert.symbol} reached ${currentPrice}`,
                is_read: false
            });

            // B. Update Alert Status
            await supabase.from('user_alerts')
                .update({ status: 'TRIGGERED' })
                .eq('id', alert.id);
        }
    }
}
