"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";
import { Github, Twitter } from "lucide-react";
import { useState } from "react";

// Google Icon Component
const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.16-3.293 2.187-2.187 2.893-5.507 2.893-8.107 0-.587-.053-1.16-.16-1.68H12.48z"
        />
    </svg>
);

interface AuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
    const { signInWithGoogle, signInWithGithub, signInWithTwitter } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (provider: () => Promise<void>) => {
        try {
            setIsLoading(true);
            await provider();
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsLoading(false); // Note: Redirect happens, so this might not unmount immediately
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-center">Welcome Back</DialogTitle>
                    <DialogDescription className="text-center">
                        Sign in to join the discussion and track your portfolio.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Button variant="outline" disabled={isLoading} onClick={() => handleLogin(signInWithGoogle)}>
                        <GoogleIcon />
                        Continue with Google
                    </Button>
                    <Button variant="outline" disabled={isLoading} onClick={() => handleLogin(signInWithGithub)}>
                        <Github className="mr-2 h-4 w-4" />
                        Continue with GitHub
                    </Button>
                    <Button variant="outline" disabled={isLoading} onClick={() => handleLogin(signInWithTwitter)}>
                        <Twitter className="mr-2 h-4 w-4" />
                        Continue with Twitter
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with email
                        </span>
                    </div>
                </div>

                <div className="grid gap-2 text-center text-sm text-muted-foreground mt-2">
                    <p>Email login is currently disabled for this preview.</p>
                </div>

            </DialogContent>
        </Dialog>
    );
}
