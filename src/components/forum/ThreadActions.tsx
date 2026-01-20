"use client";

import { useAuth } from "@/context/AuthProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditThreadDialog } from "./EditThreadDialog";
import { MoreHorizontal, Trash2, Lock, Unlock, Pin, PinOff, Loader2, Edit, Flag } from "lucide-react";
import { useState } from "react";
import { deleteThread, toggleThreadLock, toggleThreadPin } from "@/lib/forum";
import { reportContent } from "@/lib/moderation";
import { ForumThread } from "@/types/forum";

interface ThreadActionsProps {
    thread: ForumThread;
}

export function ThreadActions({ thread }: ThreadActionsProps) {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // Permissions
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'high_level' || profile?.role === 'moderator';
    const isAuthor = user?.id === thread.author_id;

    if (!user) return null;
    if (!user) return null;
    // if (!isAdmin && !isAuthor) return null; // Logic moved to individual items

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        setLoading(true);
        try {
            const { error } = await action();
            if (error) throw error;
            console.log(successMsg);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async () => {
        const reason = prompt("Reason for reporting this thread?");
        if (!reason) return;
        setLoading(true);
        try {
            const res = await reportContent('thread', thread.id, reason);
            if (res.error) throw new Error(res.error);
            alert("Report submitted for review.");
        } catch (e) {
            console.error(e);
            alert("Failed to submit report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 data-[state=open]:bg-slate-800">
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-slate-900 border-slate-800 text-slate-300">
                    {isAdmin && (
                        <>
                            <DropdownMenuItem
                                onClick={() => handleAction(() => toggleThreadPin(thread.id, !thread.is_pinned), "Pin Toggled")}
                                disabled={loading}
                            >
                                {thread.is_pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                {thread.is_pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleAction(() => toggleThreadLock(thread.id, !thread.is_locked), "Lock Toggled")}
                                disabled={loading}
                            >
                                {thread.is_locked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                {thread.is_locked ? "Unlock" : "Lock"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800" />
                        </>
                    )}

                    {(isAuthor || isAdmin) && (
                        <>
                            {isAuthor && (
                                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="text-rose-500 focus:text-rose-500 focus:bg-rose-950/20"
                                onClick={() => {
                                    const reason = prompt("Reason for deleting this thread?", "User deleted");
                                    if (reason) {
                                        handleAction(() => deleteThread(thread.id, reason).then(res => {
                                            if (!res.error) window.location.href = "/forum";
                                            return res;
                                        }), "Deleted");
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete
                            </DropdownMenuItem>
                        </>
                    )}

                    {!isAuthor && (
                        <DropdownMenuItem onClick={handleReport} disabled={loading}>
                            <Flag className="mr-2 h-4 w-4" /> Report
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu >

            <EditThreadDialog thread={thread} open={showEdit} onOpenChange={setShowEdit} />
        </>
    );
}
