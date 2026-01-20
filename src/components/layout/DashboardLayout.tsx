import Header from "@/components/layout/Header";
import { OnboardingModal } from "@/components/auth/OnboardingModal";

export default function DashboardLayout({
    children,
    leftSidebar,
    rightSidebar,
    header,
}: {
    children: React.ReactNode;
    leftSidebar?: React.ReactNode;
    rightSidebar?: React.ReactNode;
    header?: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {header || <Header />}
            </div>

            {/* Standard Grid Layout with Sticky Sidebars */}
            <div className="flex-1 w-full max-w-[2000px] mx-auto min-h-0 md:flex md:gap-6 p-4 md:px-6 lg:px-8 pt-6 relative">
                {/* Left Sidebar (Watchlist) - Sticky */}
                {leftSidebar && (
                    <aside className="hidden md:flex w-[21%] sticky top-[80px] h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pr-2 flex-col gap-4 flex-none z-40">
                        {leftSidebar}
                    </aside>
                )}

                {/* Center Main (Calendar/Data) - Flows Naturally (Global Scroll) */}
                <main className="flex-1 space-y-4 min-w-0 pb-10">
                    {children}
                </main>

                {/* Right Sidebar (News) - Sticky */}
                <aside className="hidden lg:flex flex-col w-[25%] sticky top-[80px] h-[calc(100vh-120px)] pl-2 flex-none z-40 overflow-hidden">
                    {rightSidebar}
                </aside>
            </div>
            <OnboardingModal />
        </div>
    );
}

