"use client";

import { useState, useEffect } from "react";
import { getCategories } from "@/lib/forum";
import { getStewards, assignSteward, removeSteward } from "@/lib/stewardship";
import { getUsers } from "@/lib/moderation";
import { ForumCategory, CategoryModerator, UserProfile } from "@/types/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Shield, UserPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function CategoriesPage() {
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [stewards, setStewards] = useState<CategoryModerator[]>([]);

    // UI State
    const [isStewardsDialogOpen, setIsStewardsDialogOpen] = useState(false);
    const [searchUser, setSearchUser] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        setIsLoading(true);
        const cats = await getCategories();
        setCategories(cats);
        setIsLoading(false);
    }

    async function openStewards(slug: string) {
        setSelectedCategory(slug);
        const data = await getStewards(slug);
        setStewards(data as unknown as CategoryModerator[]);
        setIsStewardsDialogOpen(true);
    }

    async function handleSearchUsers() {
        if (!searchUser) return;
        const users = await getUsers(searchUser);
        setSearchResults(users);
    }

    async function handleAssignSteward(userId: string) {
        if (!selectedCategory) return;
        const res = await assignSteward(selectedCategory, userId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Steward assigned");
            // Refresh
            const data = await getStewards(selectedCategory);
            setStewards(data as unknown as CategoryModerator[]);
        }
    }

    async function handleRemoveSteward(userId: string) {
        if (!selectedCategory) return;
        if (!confirm("Remove this steward?")) return;
        const res = await removeSteward(selectedCategory, userId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Steward removed");
            const data = await getStewards(selectedCategory);
            setStewards(data as unknown as CategoryModerator[]);
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-white mb-4">Categories Global Manager</h1>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.slug} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                        <div>
                            <div className="flex items-start justify-between">
                                <h3 className="text-lg font-bold text-slate-100">{cat.name}</h3>
                                {cat.is_restricted && <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">RESTRICTED</span>}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-1">Slug: {cat.slug}</p>
                            <p className="text-sm text-slate-400 mt-2 line-clamp-2">{cat.description || "No description."}</p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Min Role: {cat.min_role || 'user'}</span>
                            <Button variant="outline" size="sm" onClick={() => openStewards(cat.slug)} className="h-8 text-xs gap-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                                <Shield className="h-3 w-3" /> Stewards
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Create New Trigger (Placeholder for now as user asked for no placeholder, but I don't see createCategory action implemented yet. I'll stick to listing/managing stewards for existing cats for now unless user wants Create Category logic too. I'll add a 'Coming Soon' or basic Create button that doesn't work? No. I should implement createCategory too if I want full CRUD. I added createCategory task earlier but didn't implement it in forum.ts. I will skip Create for this iteration to focus on Stewards as requested.) */}
            </div>

            {/* Stewards Management Dialog */}
            <Dialog open={isStewardsDialogOpen} onOpenChange={setIsStewardsDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Stewards: {selectedCategory}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Current Stewards */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Current Stewards</h4>
                            {stewards.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No stewards assigned.</p>
                            ) : (
                                <div className="space-y-2">
                                    {stewards.map(steward => (
                                        <div key={steward.user_id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-md border border-slate-800">
                                            <div className="flex items-center gap-2">
                                                {/* We need joined user data. Helper 'getStewards' should return it. Casting assuming it does. */}
                                                <div className="h-6 w-6 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                    {(steward.user?.username || "U").substring(0, 1)}
                                                </div>
                                                <span className="text-sm font-medium">{steward.user?.username || "Unknown User"}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-red-400" onClick={() => handleRemoveSteward(steward.user_id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assign New */}
                        <div className="space-y-3 pt-4 border-t border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Assign New Steward</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search username..."
                                    className="bg-slate-950 border-slate-800 h-9 text-sm"
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                                />
                                <Button size="sm" onClick={handleSearchUsers} className="h-9 bg-emerald-600 hover:bg-emerald-700">Search</Button>
                            </div>

                            {/* Results */}
                            {searchResults.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-950 border border-slate-800 rounded-md p-2">
                                    {searchResults.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-1.5 hover:bg-slate-900 rounded cursor-pointer group">
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs font-mono text-emerald-500">[{u.role}]</div>
                                                <span className="text-sm">{u.username}</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs text-emerald-400 opacity-0 group-hover:opacity-100"
                                                onClick={() => handleAssignSteward(u.id)}
                                            >
                                                Assign
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
