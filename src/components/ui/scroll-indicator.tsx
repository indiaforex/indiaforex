"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollIndicatorProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    className?: string;
    orientation?: "vertical" | "horizontal";
}

export default function ScrollIndicator({ containerRef, className, orientation = "vertical" }: ScrollIndicatorProps) {
    const [status, setStatus] = useState<"hidden" | "scroll-start" | "scroll-end">("hidden");

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const checkScroll = () => {
            if (orientation === "vertical") {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isScrollable = scrollHeight > clientHeight;
                const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;

                if (!isScrollable) {
                    setStatus("hidden");
                } else if (isAtBottom) {
                    setStatus("scroll-end"); // previously "scroll-up" (meaning go to top)
                } else {
                    setStatus("scroll-start"); // previously "scroll-down"
                }
            } else {
                // Horizontal Logic
                const { scrollLeft, scrollWidth, clientWidth } = container;
                const isScrollable = scrollWidth > clientWidth;
                // scrollLeft + clientWidth === scrollWidth (approx)
                const isAtEnd = Math.abs(scrollWidth - clientWidth - scrollLeft) < 5;

                if (!isScrollable) {
                    setStatus("hidden");
                } else if (isAtEnd) {
                    setStatus("scroll-end");
                } else {
                    setStatus("scroll-start");
                }
            }
        };

        // Initial check and event listener
        checkScroll();
        container.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);

        const interval = setInterval(checkScroll, 1000);

        return () => {
            container.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
            clearInterval(interval);
        };
    }, [containerRef, orientation]);

    if (status === "hidden") return null;

    return (
        <div className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 animate-pulse", className)}>
            {status === "scroll-start" ? (
                <>
                    <span>Scroll</span>
                    <ChevronDown className="h-3 w-3 animate-bounce" />
                </>
            ) : (
                <>
                    <span>{orientation === "vertical" ? "Top" : "Start"}</span>
                    <ChevronUp className="h-3 w-3 animate-bounce" />
                </>
            )}
        </div>
    );
}
