"use client";

import { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol }: { symbol: string }) {
    const container = useRef<HTMLSpanElement>(null);
    const id = useRef(`tv_${Math.random().toString(36).substring(2, 9)}`).current;
    const isAppended = useRef(false);

    useEffect(() => {
        if (!container.current || isAppended.current) return;
        isAppended.current = true;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "calendar": false,
            "container_id": id,
            "support_host": "https://www.tradingview.com"
        });

        container.current.appendChild(script);

    }, [symbol, id]);

    return (
        <span className="tradingview-widget-container h-full w-full block" ref={container} style={{ height: "100%", width: "100%" }}>
            <span id={id} className="tradingview-widget-container__widget block" style={{ height: "calc(100% - 32px)", width: "100%" }}></span>
        </span>
    );
}

export default memo(TradingViewWidget);
