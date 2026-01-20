"use client";

import { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol }: { symbol: string }) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentContainer = container.current;
        if (!currentContainer) return;

        // Cleanup function for internal use
        // We create a container div for the widget
        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        widgetContainer.style.height = "calc(100% - 32px)";
        widgetContainer.style.width = "100%";
        currentContainer.appendChild(widgetContainer);

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
            "support_host": "https://www.tradingview.com"
        });
        currentContainer.appendChild(script);

        return () => {
            // Aggressive cleanup to prevent 'contentWindow' errors
            if (currentContainer) {
                currentContainer.innerHTML = "";
            }
        };
    }, [symbol]);

    return (
        <div className="tradingview-widget-container h-full w-full" ref={container} style={{ height: "100%", width: "100%" }} />
    );
}

export default memo(TradingViewWidget);
