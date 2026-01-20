"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, useEffect } from "react";
import { getCategories } from "@/lib/forum";
import { ForumCategory } from "@/types/forum";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { updateThread } from "@/lib/forum";
import { ForumThread } from "@/types/forum";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { toast } from "sonner";

interface EditThreadDialogProps {
    thread: ForumThread;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditThreadDialog({ thread, open, onOpenChange }: EditThreadDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ForumCategory[]>([]);

    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

    const [formData, setFormData] = useState({
        title: thread.title,
        category: thread.category,
        content: thread.content,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        try {
            const { error } = await updateThread(thread.id, {
                title: formData.title,
                content: formData.content,
                category: formData.category
            });

            if (error) {
                toast.error("Failed to update thread");
            } else {
                toast.success("Thread updated successfully");
                onOpenChange(false);
                window.location.reload();
            }
        } catch (error) {
            console.error("Error updating thread:", error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Thread</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                            id="edit-title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) => setFormData({ ...formData, category: val })}
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
                        <Label htmlFor="edit-content">Content</Label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(val) => setFormData({ ...formData, content: val || "" })}
                            height={300}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
