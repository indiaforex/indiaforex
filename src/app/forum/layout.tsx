import AdContainer from "@/components/dashboard/AdContainer";
import ForumHeader from "@/components/forum/ForumHeader";
import DashboardLayout from "@/components/layout/DashboardLayout";

// This layout wraps all pages under /forum
// It injects the custom ForumHeader and the Right Sidebar AdContainer
export default function ForumLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardLayout
            header={<ForumHeader />}
            rightSidebar={<AdContainer className="h-full mt-0" />}
        >
            {/* 
              This 'children' will contain the page.tsx content.
              Note: DashboardLayout puts 'children' in the center <main> column.
              We are NOT using the left sidebar here to give max width to the terminal view, 
              or we could add a ForumNav later if needed.
            */}
            {children}
        </DashboardLayout>
    );
}
