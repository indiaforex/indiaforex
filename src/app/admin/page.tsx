'use client';

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminRootPage() {
    const { profile, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!profile) {
            router.replace('/forum'); // Or login
            return;
        }

        const role = profile.role;

        if (role === 'admin' || role === 'super_admin') {
            router.replace('/admin/moderation');
        } else if (role === 'event_analyst') {
            router.replace('/admin/events');
        } else {
            router.replace('/forum'); // Unauthorized
        }
    }, [isLoading, profile, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
        </div>
    );
}
