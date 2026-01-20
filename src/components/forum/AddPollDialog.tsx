"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createPoll } from "@/lib/forum";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddPollDialogProps {
    threadId: string;
    existingActivePoll?: boolean; // Warning context
    authorId: string;
}

export function AddPollDialog({ threadId, existingActivePoll, authorId }: AddPollDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [allowMultiple, setAllowMultiple] = useState(false);

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };

    const addOption = () => setOptions([...options, ""]);

    const removeOption = (idx: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        const validOptions = options.filter(o => o.trim() !== "");
        if (!question.trim() || validOptions.length < 2) {
            alert("Please provide a question and at least 2 options.");
            return;
        }

        setLoading(true);
        const { error } = await createPoll(threadId, {
            question,
            options: validOptions,
            allow_multiple: allowMultiple
        });

        setLoading(false);

        if (error) {
            alert("Failed to create poll: " + (typeof error === 'string' ? error : error.message));
        } else {
            setOpen(false);
            setQuestion("");
            setOptions(["", ""]);
            router.refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-2 text-[10px] font-mono border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/30">
                    <Plus className="h-3 w-3" />
                    <span className="sm:hidden">POLL</span>
                    <span className="hidden sm:inline">ADD POLL</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle>Create a Poll</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Add a poll to this discussion.
                        {existingActivePoll && <span className="block text-amber-500 mt-1">Warning: Adding a new poll will close the current active one.</span>}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="What would you like to ask?"
                            className="bg-slate-900 border-slate-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Options</Label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Input
                                    value={opt}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                    className="bg-slate-900 border-slate-800"
                                />
                                {options.length > 2 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                                        <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-400" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={addOption} className="text-emerald-400 hover:text-emerald-300">
                            + Add Option
                        </Button>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="multi">Allow Multiple Votes</Label>
                        <Switch
                            id="multi"
                            checked={allowMultiple}
                            onCheckedChange={setAllowMultiple}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                        {loading ? "Creating..." : "Start Poll"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
