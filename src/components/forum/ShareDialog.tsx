"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function ShareDialog({ title, threadId }: { title?: string, threadId?: string }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const getUrl = () => {
        if (typeof window !== "undefined") {
            return window.location.href;
        }
        return "";
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getUrl());
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp') => {
        const url = encodeURIComponent(getUrl());
        const text = encodeURIComponent(title || "Check out this thread on India Forex Board");

        let shareUrl = "";
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-2 text-[10px] font-mono border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/30">
                    <Share2 className="h-3 w-3" /> SHARE<span className="hidden sm:inline"> THREAD</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-slate-800 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-slate-200 font-mono">Share Thread</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={getUrl()}
                            className="bg-slate-900 border-slate-700 text-slate-400 font-mono text-xs h-9"
                        />
                        <Button size="sm" onClick={handleCopy} className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white h-9 w-9 p-0">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={() => handleShare('twitter')} className="border-slate-800 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 gap-2 h-10">
                            <Twitter className="h-4 w-4" /> Twitter
                        </Button>
                        <Button variant="outline" onClick={() => handleShare('whatsapp')} className="border-slate-800 hover:bg-[#25D366]/20 hover:text-[#25D366] hover:border-[#25D366]/50 gap-2 h-10">
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                        <Button variant="outline" onClick={() => handleShare('linkedin')} className="border-slate-800 hover:bg-[#0A66C2]/20 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 gap-2 h-10">
                            <Linkedin className="h-4 w-4" /> LinkedIn
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
