"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
    error: Error & { digest?: string };
    reset: () => void;
    reload?: () => void;
}

export function ErrorState({ error, reset, reload }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-200">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl text-center space-y-6">
                <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full mb-4">
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white">System Error</h1>
                    <p className="text-slate-400">
                        A critical error occurred. Our team has been notified.
                    </p>
                    {error.digest && (
                        <p className="text-xs font-mono text-slate-600">
                            Error Digest: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex gap-4 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="border-slate-700 hover:bg-slate-800"
                    >
                        Return to Home
                    </Button>
                    <Button
                        onClick={() => reset()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
