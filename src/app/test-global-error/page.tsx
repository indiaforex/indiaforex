"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function TestGlobalErrorPage() {
    return (
        <ErrorState
            error={new Error("This is a test error message to demonstrate the global error UI.") as Error & { digest?: string }}
            reset={() => window.location.reload()}
            reload={() => window.location.reload()}
        />
    );
}
