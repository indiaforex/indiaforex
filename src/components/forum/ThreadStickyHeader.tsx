"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ForumThread } from "@/types/forum";
import { Pin, ArrowUp } from "lucide-react";
import { BookmarkButton } from "./BookmarkButton";
import { cn } from "@/lib/utils";

interface ThreadStickyHeaderProps {
    thread: ForumThread;
}

export function ThreadStickyHeader({ thread }: ThreadStickyHeaderProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsVisible(scrollY > 100);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="sticky top-16 z-[45] w-full h-0 pointer-events-none">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute top-0 left-0 w-full px-4 py-2 bg-gradient-to-b from-slate-950/90 to-slate-950/40 backdrop-blur-3xl border border-slate-800/60 shadow-2xl shadow-emerald-500/20 cursor-pointer pointer-events-auto rounded-b-lg"
                        onClick={scrollToTop}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {thread.is_pinned && (
                                    <Pin className="h-3 w-3 text-amber-500 flex-shrink-0 rotate-45" />
                                )}
                                <div className="flex flex-col overflow-hidden min-w-0 relative w-full">
                                    <style>{`
                                        @keyframes marquee {
                                            0% { transform: translateX(0); }
                                            100% { transform: translateX(-100%); }
                                        }
                                    `}</style>
                                    <div
                                        className={cn(
                                            "text-sm font-bold text-slate-100 whitespace-nowrap flex",
                                            thread.is_pinned ? "text-amber-50" : ""
                                        )}
                                        style={thread.title.length > 30 ? {
                                            animation: "marquee 15s linear infinite",
                                            animationDelay: "5s",
                                            width: "max-content"
                                        } : {}}
                                    >
                                        <span>{thread.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                        <span className="uppercase text-emerald-500">{thread.category}</span>
                                        <span>|</span>
                                        <span>{thread.author?.username}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Saved & Expand Hint */}
                            <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <BookmarkButton threadId={thread.id} />
                                {/* Visual hint that clicking expands */}
                                <button
                                    onClick={scrollToTop}
                                    className="p-1 text-slate-500 hover:text-white transition-colors"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
