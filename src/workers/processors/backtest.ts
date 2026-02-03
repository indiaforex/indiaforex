import { Job } from 'bullmq';
import YahooFinance from 'yahoo-finance2';

interface BacktestParams {
    symbol: string;
    strategy: 'SMA_CROSS' | 'RSI_STRATEGY' | 'BOLLINGER_BANDS';
    initialCapital: number;
    timeframe?: '1d' | '1h' | '15m';
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    fastPeriod?: number;
    slowPeriod?: number;
    tradingStartHour?: number;
    tradingEndHour?: number;
    rsiPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
}

export async function backtestProcessor(job: Job) {
    const {
        symbol,
        strategy,
        initialCapital,
        timeframe = '1d',
        startDate,
        endDate,
        fastPeriod = 50,
        slowPeriod = 200
    } = job.data as BacktestParams;

    console.log(`[Backtest] Starting ${strategy} for ${symbol} (${timeframe})...`);

    try {
        // 1. Fetch History via Yahoo Finance
        const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

        // Yahoo Finance Interval Validation
        let queryPeriod1 = startDate || '2023-01-01';
        const queryPeriod2 = endDate || new Date().toISOString().split('T')[0];

        const endDateObj = new Date(queryPeriod2);
        const startDateObj = new Date(queryPeriod1);
        const diffDays = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24);

        if (timeframe === '1h' && diffDays > 729) {
            console.log(`[Backtest] Clamping 1h data to last 729 days (Yahoo limit).`);
            const clampedDate = new Date(endDateObj.getTime() - (729 * 24 * 3600 * 1000));
            queryPeriod1 = clampedDate.toISOString().split('T')[0];
        } else if (timeframe === '15m' && diffDays > 59) {
            console.log(`[Backtest] Clamping 15m data to last 59 days (Yahoo limit).`);
            const clampedDate = new Date(endDateObj.getTime() - (59 * 24 * 3600 * 1000));
            queryPeriod1 = clampedDate.toISOString().split('T')[0];
        }

        const queryOptions: any = {
            period1: queryPeriod1,
            period2: queryPeriod2,
            interval: timeframe
        };

        console.log(`[Backtest] Fetching data with options:`, queryOptions);

        const result = await yf.chart(symbol, queryOptions);
        const rawHistory = result.quotes as any[];

        if (!rawHistory || rawHistory.length === 0) {
            throw new Error("No data returned from Yahoo Finance.");
        }

        // Filter out bad ticks
        const history = rawHistory.filter(h => h.close != null && h.date != null && !isNaN(h.close));

        if (history.length < slowPeriod) {
            throw new Error(`Insufficient data. Have ${history.length} ticks, need ${slowPeriod} for moving average.`);
        }

        // 2. Indicators Logic
        const prices = history.map(h => h.close);
        const dates = history.map(h => h.date.toISOString());

        // Calculate Indicators
        // SMA is always calculated for potential future logic, or we can make it conditional.
        // For debugging/graphs, having SMAs is nice even for RSI strategy, but let's keep it simple.
        const fastMA = calculateSMA(prices, fastPeriod);
        const slowMA = calculateSMA(prices, slowPeriod);

        let rsiArray: number[] = [];
        if (strategy === 'RSI_STRATEGY') {
            const rsiPeriod = job.data.rsiPeriod || 14;
            rsiArray = calculateRSI(prices, rsiPeriod);
        }

        // 3. Simulation Logic
        let cash = initialCapital;
        let holdings = 0;
        const trades: any[] = [];
        const equityCurve: { date: string; equity: number }[] = [];

        let peakEquity = initialCapital;
        let maxDrawdown = 0;
        let wins = 0;
        let losses = 0;

        // Loop
        for (let i = slowPeriod; i < prices.length; i++) {
            const price = prices[i];
            const dateStr = dates[i];
            const date = new Date(dateStr);

            // Trading Hours Filter
            if (timeframe !== '1d' && job.data.tradingStartHour !== undefined && job.data.tradingEndHour !== undefined) {
                const currentHour = date.getHours();
                const startH = job.data.tradingStartHour;
                const endH = job.data.tradingEndHour;

                // If strictly outside the window, skip entry logic.
                if (currentHour < startH || currentHour >= endH) {
                    // We skip trading logic, but wait, if we have a position, does it close?
                    // For now, let's assume "Trading Hours" means "Active Strategy Hours".
                    // We just continue to the next candle without acting. 
                    // But we MUST record equity for the chart.
                    const currentVal = cash + (holdings * price);
                    equityCurve.push({ date: dateStr, equity: Math.round(currentVal) });
                    continue;
                }
            }

            // --- STRATEGY EXECUTION ---
            if (strategy === 'SMA_CROSS') {
                const prevFast = fastMA[i - 1];
                const prevSlow = slowMA[i - 1];
                const currFast = fastMA[i];
                const currSlow = slowMA[i];

                const buySignal = prevFast <= prevSlow && currFast > currSlow;
                const sellSignal = prevFast >= prevSlow && currFast < currSlow;

                if (buySignal && holdings === 0) {
                    // BUY
                    holdings = cash / price;
                    cash = 0;
                    trades.push({ type: 'BUY', date: dateStr, price, equity: holdings * price });
                } else if (sellSignal && holdings > 0) {
                    // SELL
                    const sellValue = holdings * price;
                    const lastBuyTradeIndex = trades.map(t => t.type).lastIndexOf('BUY');
                    const buyPrice = lastBuyTradeIndex !== -1 ? trades[lastBuyTradeIndex].price : 0;
                    const profit = sellValue - (holdings * buyPrice);
                    if (profit > 0) wins++; else losses++;
                    cash = sellValue;
                    holdings = 0;
                    trades.push({ type: 'SELL', date: dateStr, price, equity: cash, profit });
                }
            }
            else if (strategy === 'RSI_STRATEGY') {
                const currentRSI = rsiArray[i];
                const rsiOversold = job.data.rsiOversold || 30;
                const rsiOverbought = job.data.rsiOverbought || 70;

                if (!isNaN(currentRSI)) {
                    // Buy Signal: RSI < Oversold
                    if (currentRSI < rsiOversold && holdings === 0) {
                        holdings = cash / price;
                        cash = 0;
                        trades.push({ type: 'BUY', date: dateStr, price, equity: holdings * price });
                    }
                    // Sell Signal: RSI > Overbought
                    else if (currentRSI > rsiOverbought && holdings > 0) {
                        const sellValue = holdings * price;
                        const lastBuyTradeIndex = trades.map(t => t.type).lastIndexOf('BUY');
                        const buyPrice = lastBuyTradeIndex !== -1 ? trades[lastBuyTradeIndex].price : 0;
                        const profit = sellValue - (holdings * buyPrice);
                        if (profit > 0) wins++; else losses++;
                        cash = sellValue;
                        holdings = 0;
                        trades.push({ type: 'SELL', date: dateStr, price, equity: cash, profit });
                    }
                }
            }
            else if (strategy === 'BOLLINGER_BANDS') { // Bollinger Bands Logic
                // Using SlowMA as the Baseline (Middle Band) usually (e.g. 20 period)
                // We'll use "slowPeriod" input as the BB Period (default 20)
                const mb = slowMA[i]; // Middle Band
                const period = job.data.slowPeriod || 20; // Default BB period

                // We need to calculate StdDev on the fly or pre-calced.
                // Pre-calc is better for perfd. Let's do on-the-fly for simplicity for now, 
                // as we have the window.
                if (i >= period) {
                    const slice = prices.slice(i - period + 1, i + 1);
                    const stdDev = calculateStdDev(slice);
                    const ub = mb + (2 * stdDev); // Upper Band
                    const lb = mb - (2 * stdDev); // Lower Band

                    // Mean Reversion Strategy:
                    // Buy when Price touches Lower Band
                    if (price <= lb && holdings === 0) {
                        holdings = cash / price;
                        cash = 0;
                        trades.push({ type: 'BUY', date: dateStr, price, equity: holdings * price });
                    }
                    // Sell when Price touches Upper Band
                    else if (price >= ub && holdings > 0) {
                        const sellValue = holdings * price;
                        const lastBuyTradeIndex = trades.map(t => t.type).lastIndexOf('BUY');
                        const buyPrice = lastBuyTradeIndex !== -1 ? trades[lastBuyTradeIndex].price : 0;
                        const profit = sellValue - (holdings * buyPrice);
                        if (profit > 0) wins++; else losses++;
                        cash = sellValue;
                        holdings = 0;
                        trades.push({ type: 'SELL', date: dateStr, price, equity: cash, profit });
                    }
                }
            }

            // Track Equity
            let currentEquity = cash;
            if (holdings > 0) currentEquity = holdings * price;

            equityCurve.push({ date: dateStr, equity: Math.round(currentEquity) });

            // Drawdown
            if (currentEquity > peakEquity) peakEquity = currentEquity;
            const dd = peakEquity > 0 ? (peakEquity - currentEquity) / peakEquity * 100 : 0;
            if (dd > maxDrawdown) maxDrawdown = dd;
        }

        // === Final Calculation ===
        const finalPrice = prices[prices.length - 1];
        const finalEquity = holdings > 0 ? (holdings * finalPrice) : cash;
        const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
        const totalTrades = Math.floor(trades.length / 2);
        const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

        let grossProfit = 0;
        let grossLoss = 0;
        trades.filter(t => t.type === 'SELL').forEach(t => {
            const p = t.profit || 0;
            if (p > 0) grossProfit += p;
            else grossLoss += Math.abs(p);
        });
        const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;

        console.log(`[Backtest] Complete. Return: ${totalReturn.toFixed(2)}%`);

        return {
            symbol,
            strategy,
            metrics: {
                totalReturn: totalReturn.toFixed(2) + '%',
                finalEquity: Math.round(finalEquity),
                totalTrades: totalTrades,
                maxDrawdown: maxDrawdown.toFixed(2) + '%',
                winRate: winRate.toFixed(1) + '%',
                profitFactor: profitFactor.toFixed(2)
            },
            trades,
            equityCurve
        };

    } catch (error: any) {
        console.error("[Backtest] Failed:", error);
        throw error;
    }
}

// Helper: SMA
function calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = new Array(data.length).fill(NaN);
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j];
        }
        sma[i] = sum / period;
    }
    return sma;
}

// Helper: RSI
function calculateRSI(data: number[], period: number = 14): number[] {
    if (data.length <= period) return new Array(data.length).fill(NaN);

    const rsi = new Array(data.length).fill(NaN);
    let up = 0;
    let down = 0;

    // Calculate initial average gain and loss for the first 'period' days
    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff > 0) up += diff;
        else down -= diff;
    }

    let avgUp = up / period;
    let avgDown = down / period;

    // Calculate the first RSI value
    if (avgDown === 0) {
        rsi[period] = 100;
    } else {
        rsi[period] = 100 - (100 / (1 + (avgUp / avgDown)));
    }

    // Calculate smoothed RSI for subsequent days
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        avgUp = ((avgUp * (period - 1)) + gain) / period;
        avgDown = ((avgDown * (period - 1)) + loss) / period;

        if (avgDown === 0) {
            rsi[i] = 100;
        } else {
            rsi[i] = 100 - (100 / (1 + (avgUp / avgDown)));
        }
    }

    return rsi;
}

// Helper: Standard Deviation
function calculateStdDev(data: number[]): number {
    const n = data.length;
    if (n === 0) return 0;
    const mean = data.reduce((a, b) => a + b) / n;
    return Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}
