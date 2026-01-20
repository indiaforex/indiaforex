'use client';

import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import Link from "next/link";
import { ShieldAlert, Calendar, LayoutDashboard, Menu, X, Hash } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const role = profile?.role;
    const isAuthorized = role === 'admin' || role === 'super_admin' || role === 'event_analyst';

    const navItems = [
        {
            name: 'Moderation',
            href: '/admin/moderation',
            icon: ShieldAlert,
            visible: isAuthorized
        },
        {
            name: 'Events Manager',
            href: '/admin/events',
            icon: Calendar,
            visible: isAuthorized
        },
        {
            name: 'Categories',
            href: '/admin/categories',
            icon: Hash,
            visible: isAuthorized
        }
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Admin<span className="text-emerald-500">Panel</span></span>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        item.visible && (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    pathname === item.href
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    ))}
                </nav>
            </div>

            <div className="p-4 mt-auto border-t border-slate-800">
                <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-2">
                    <span>&larr; Return to Website</span>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-emerald-500 rounded-md flex items-center justify-center">
                        <LayoutDashboard className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-bold text-white">Admin</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 pt-16 bg-slate-950/95 backdrop-blur-sm animate-in fade-in slide-in-from-top-10">
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => (
                            item.visible && (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md",
                                        pathname === item.href
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "text-slate-400 hover:bg-slate-900"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        ))}
                        <div className="pt-4 border-t border-slate-800 mt-4">
                            <Link href="/" className="text-sm text-slate-500 flex items-center gap-2 px-4 py-2">
                                &larr; Return to Website
                            </Link>
                        </div>
                    </nav>
                </div>
            )}

            {/* Desktop Sidebar (Left) */}
            <aside className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:pl-64 w-full">
                {children}
            </main>
        </div>
    );
}
