"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
// Assuming we don't have use-debounce, I'll implement simple effect.

export function ForumToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial State from URL
    const initialSearch = searchParams.get("search") || "";
    const initialCategory = searchParams.get("category") || "all";

    const [search, setSearch] = useState(initialSearch);
    const [category, setCategory] = useState(initialCategory);

    // Effect to update URL
    const updateUrl = useCallback((newSearch: string, newCategory: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newSearch) {
            params.set("search", newSearch);
        } else {
            params.delete("search");
        }

        if (newCategory && newCategory !== "all") {
            params.set("category", newCategory);
        } else {
            params.delete("category");
        }

        // Reset page on filter change
        params.delete("page");

        router.push(`/forum?${params.toString()}`);
    }, [router, searchParams]);

    // Handle Search Debounce
    // Since I don't know if use-debounce is installed (it's common but not guaranteed), I will stick to useEffect with timeout if I don't import it.
    // Actually, I'll write a manual debounce effect to be safe and dependency-free.

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== initialSearch) {
                updateUrl(search, category);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, category, updateUrl, initialSearch]);

    // Handle Category Change (Immediate)
    const handleCategoryChange = (val: string) => {
        setCategory(val);
        updateUrl(search, val); // Immediate update for select
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search discussions..."
                    className="pl-9 bg-slate-900/50 border-slate-800"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="w-[180px]">
                <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-800">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="equities">Equities</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                        <SelectItem value="macro">Macro</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Simple internal debounce if needed, but I used useEffect above.
// Corrected: Removed use-debounce import to avoid error and used useEffect logic.
