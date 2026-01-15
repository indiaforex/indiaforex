"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function OnboardingModal() {
    const { user, profile, isLoading, refreshProfile } = useAuth();
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    useEffect(() => {
        // Show if user is logged in (and not loading) but has no profile (or no username in profile)
        if (!isLoading && user && (!profile || !profile.username)) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [user, profile, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            setSubmitting(false);
            return;
        }

        try {
            // Check uniqueness
            const { data: existing } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username)
                .single();

            if (existing) {
                setError("Username already taken.");
                setSubmitting(false);
                return;
            }

            // Update profile (using update instead of upsert since trigger creates the row)
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    username: username,
                    avatar_url: user!.user_metadata?.avatar_url || user!.user_metadata?.picture, // Fallback for Google
                    // role is 'user' by default from trigger
                    // updated_at is auto-handled if we had a trigger, but we removed the column usage for now
                })
                .eq('id', user!.id);

            if (updateError) throw updateError;

            await refreshProfile();
            setOpen(false);

        } catch (err: any) {
            console.error("Onboarding error:", err);
            setError(err.message || "Failed to update profile.");
        } finally {
            setSubmitting(false);
        }
    };

    // If we are not open, render nothing
    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing if forced (i.e. if user HAS to set username)
            // For now, let's allow closing but they can't participate fully? 
            // Better to force it for 'forum' usage, but maybe not for viewing.
            // Let's force it for now.
            if (!val && (!profile || !profile.username)) return;
            setOpen(val);
        }}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome to IndiaForex</DialogTitle>
                    <DialogDescription>
                        Please choose a unique username to participate in the community.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Trader123"
                            autoComplete="off"
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Complete Setup
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
