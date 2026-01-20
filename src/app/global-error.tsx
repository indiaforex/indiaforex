"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <html lang="en" className="dark">
            <body className="antialiased">
                <ErrorState error={error} reset={reset} />
            </body>
        </html>
    );
}
