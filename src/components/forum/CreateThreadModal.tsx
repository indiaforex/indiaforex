"use client";

import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { getCategories } from "@/lib/forum";
import { ForumCategory } from "@/types/forum";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MessageCirclePlus, Loader2, BarChartHorizontal, Plus, X } from "lucide-react";
import { createThread } from "@/lib/forum";

export function CreateThreadModal() {
    const { user, profile } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ForumCategory[]>([]);

    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

    // Thread State
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        content: "",
    });

    // Poll State
    const [showPoll, setShowPoll] = useState(false);
    const [pollData, setPollData] = useState({
        question: "",
        options: ["", ""], // Start with 2 empty options
        allow_multiple: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;

        setLoading(true);

        try {
            // Prepare Poll Data if enabled
            const finalPollData = showPoll ? {
                question: pollData.question || formData.title, // Default to title if empty
                options: pollData.options.filter(o => o.trim() !== ""),
                allow_multiple: pollData.allow_multiple
            } : undefined;

            if (showPoll && (!finalPollData?.options || finalPollData.options.length < 2)) {
                alert("Poll must have at least 2 options.");
                setLoading(false);
                return;
            }

            await createThread({
                title: formData.title,
                content: formData.content,
                category: formData.category,
                tags: [],
                author_id: user.id
            }, finalPollData);

            console.log("Thread created successfully");
            setOpen(false);
            setFormData({ title: "", category: "", content: "" });
            setPollData({ question: "", options: ["", ""], allow_multiple: false });
            setShowPoll(false);

            // Reload to show new thread (MVP)
            window.location.reload();

        } catch (error) {
            console.error("Error creating thread:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...pollData.options];
        newOptions[index] = value;
        setPollData({ ...pollData, options: newOptions });
    };

    const addOption = () => {
        setPollData({ ...pollData, options: [...pollData.options, ""] });
    };

    const removeOption = (index: number) => {
        if (pollData.options.length <= 2) return;
        const newOptions = pollData.options.filter((_, i) => i !== index);
        setPollData({ ...pollData, options: newOptions });
    };

    // Role Check
    const isAllowed = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'high_level' || profile?.role === 'moderator' || profile?.role === 'user'; // Allow users to post for now

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <MessageCirclePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Thread</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Start a Discussion</DialogTitle>
                    <DialogDescription>
                        Share market insights or ask questions. Keep it professional.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Thread Details */}
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., USD/INR Outlook for next week"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) => setFormData({ ...formData, category: val })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.slug} value={cat.slug}>
                                        {cat.name}
                                        {cat.is_restricted && " (VIP)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <RichTextEditor
                            placeholder="Share your analysis or question..."
                            value={formData.content}
                            onChange={(val) => setFormData({ ...formData, content: val || "" })}
                            height={300}
                        />
                    </div>

                    {/* Poll Toggle */}
                    <div className="border-t border-slate-800 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                type="button"
                                variant={showPoll ? "secondary" : "outline"}
                                onClick={() => setShowPoll(!showPoll)}
                                className="gap-2 w-full justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <BarChartHorizontal className="h-4 w-4" />
                                    <span>{showPoll ? "Remove Poll" : "Add a Poll"}</span>
                                </div>
                                {showPoll && <X className="h-4 w-4" />}
                            </Button>
                        </div>

                        {showPoll && (
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
                                <div className="grid gap-2">
                                    <Label>Poll Question</Label>
                                    <Input
                                        placeholder="Ask a question..."
                                        value={pollData.question}
                                        onChange={(e) => setPollData({ ...pollData, question: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-500">Leave empty to use thread title.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Options</Label>
                                    {pollData.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                placeholder={`Option ${idx + 1}`}
                                                value={opt}
                                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            />
                                            {pollData.options.length > 2 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                                                    <X className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full gap-2 border-dashed">
                                        <Plus className="h-3 w-3" /> Add Option
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="allow_multiple"
                                        className="rounded border-slate-700 bg-slate-800"
                                        checked={pollData.allow_multiple}
                                        onChange={(e) => setPollData({ ...pollData, allow_multiple: e.target.checked })}
                                    />
                                    <Label htmlFor="allow_multiple" className="text-sm font-normal cursor-pointer">Allow multiple votes</Label>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post Thread
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
