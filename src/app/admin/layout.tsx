'use client';

import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import Link from "next/link";
import {
    ShieldAlert,
    Calendar,
    LayoutDashboard,
    Menu,
    X,
    Hash,
    TrendingUp,
    Users,
    Activity,
    FileText
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const role = profile?.role;
    const isAuthorized = role === 'admin' || role === 'super_admin' || role === 'event_analyst';
    const isSuperAdmin = role === 'super_admin' || role === 'admin'; // Allow admin for now

    const navItems = [
        {
            name: 'Moderation',
            href: '/admin/moderation',
            icon: ShieldAlert,
            visible: isAuthorized
        },
        {
            name: 'User Management',
            href: '/admin/users',
            icon: Users,
            visible: isSuperAdmin
        },
        {
            name: 'Events Manager',
            href: '/admin/events',
            icon: Calendar,
            visible: isAuthorized
        },
        {
            name: 'Predictions',
            href: '/admin/predictions',
            icon: TrendingUp,
            visible: isAuthorized
        },
        {
            name: 'Categories',
            href: '/admin/categories',
            icon: Hash,
            visible: isAuthorized
        },
        {
            name: 'System Health',
            href: '/admin/system',
            icon: Activity,
            visible: isSuperAdmin
        },
        {
            name: 'Audit Logs',
            href: '/admin/logs',
            icon: FileText,
            visible: isSuperAdmin
        }
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-950/50 backdrop-blur-xl border-r border-slate-800">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <LayoutDashboard className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-wide">INDIA<span className="text-emerald-500">FOREX</span></span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Admin Terminal</span>
                    </div>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        item.visible && (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                                    pathname === item.href
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 hover:translate-x-1"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-4 w-4 transition-colors",
                                    pathname === item.href ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                {item.name}
                            </Link>
                        )
                    ))}
                </nav>
            </div>

            <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-900/20">
                <Link href="/" className="group flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-white transition-colors">
                    <div className="p-1 rounded bg-slate-800 group-hover:bg-slate-700 transition-colors">
                        <span className="block w-20 h-1 rounded-full bg-slate-600 group-hover:bg-emerald-500 transition-all"></span>
                    </div>
                    <span>Back to App</span>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30">
            {/* Mobile Header */}
            <header className="md:hidden bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-emerald-500 rounded-md flex items-center justify-center">
                        <LayoutDashboard className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-bold text-white text-sm">Admin Terminal</span>
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
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg",
                                        pathname === item.href
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "text-slate-400 hover:bg-slate-900"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        ))}
                        <div className="pt-4 border-t border-slate-800 mt-4">
                            <Link href="/" className="text-sm text-slate-500 flex items-center gap-2 px-4 py-2 hover:text-white transition-colors">
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
            <main className="flex-1 md:pl-64 w-full min-h-screen bg-[url('/grid.svg')] bg-fixed">
                <div className="absolute inset-0 bg-slate-950/90 pointer-events-none z-0"></div>
                <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
