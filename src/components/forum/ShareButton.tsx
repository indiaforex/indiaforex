"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton() {
    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Thread link copied to clipboard");
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-7 gap-2 text-[10px] font-mono border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/30"
        >
            <Share2 className="h-3 w-3" /> SHARE_THREAD
        </Button>
    );
}
