"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthProvider";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MessageCirclePlus, Loader2 } from "lucide-react";

export function CreateThreadModal() {
    const { user, profile } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        content: "",
    });
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !profile) return; // Should not happen if button is hidden, but safety first

        setLoading(true);

        try {
            const { error } = await supabase.from("forum_threads").insert({
                title: formData.title,
                category: formData.category,
                content: formData.content,
                author_id: user.id,
                tags: [], // Optional: Add tags input later
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
            });

            if (error) throw error;

            console.log("Thread created successfully");
            setOpen(false);
            setFormData({ title: "", category: "", content: "" });
            // In a real app we'd use a router.refresh() or toast here
            // window.location.reload(); // Simple refresh for MVP

        } catch (error) {
            console.error("Error creating thread:", error);
            // alert("Failed to create thread"); 
        } finally {
            setLoading(false);
        }
    };

    // Role Check
    const isAllowed = profile?.role === 'admin' || profile?.role === 'high_level' || profile?.role === 'moderator';

    if (!user || !isAllowed) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <MessageCirclePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Thread</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Start a Discussion</DialogTitle>
                    <DialogDescription>
                        Share market insights or ask questions. Keep it professional.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., USD/INR Outlook for next week"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) =>
                                setFormData({ ...formData, category: val })
                            }
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="forex">Forex</SelectItem>
                                <SelectItem value="equities">Equities</SelectItem>
                                <SelectItem value="commodities">Commodities</SelectItem>
                                <SelectItem value="macro">Macro Economics</SelectItem>
                                <SelectItem value="technical">Technical Analysis</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                            id="content"
                            placeholder="Share your analysis or question..."
                            className="h-32"
                            value={formData.content}
                            onChange={(e) =>
                                setFormData({ ...formData, content: e.target.value })
                            }
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post Thread
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
