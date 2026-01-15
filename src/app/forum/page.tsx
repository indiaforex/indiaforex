import { getRecentThreads } from "@/lib/forum";
import { ForumHighlights } from "@/components/forum/ForumHighlights";
import { CreateThreadModal } from "@/components/forum/CreateThreadModal";
import { ForumThread } from "@/types/forum";

// Since this is a client page component or server? 
// The original was async server component, but we are importing UseClient stuff like CreateThreadModal
// Standard Next.js server component is fine if CreateThreadModal is client.
// However, creating a server component that imports other components is fine.

// IMPORTANT: We need to pass data to ForumHighlights. `getRecentThreads` is server side.
// So this page component must be Server Component.

export default async function ForumIndexPage() {
    const threads = await getRecentThreads();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-slate-800/60 bg-slate-900/20 rounded-lg">
                <div>
                    <h1 className="text-xl font-mono font-bold text-emerald-400 tracking-tight">{">"} COMMUNITY_FORUM</h1>
                    <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider">
                        // Join the discussion on market trends
                    </p>
                </div>
                <CreateThreadModal />
            </div>

            {/* 
              Reusing ForumHighlights for now, but in a real app this would be a full paginated list 
              with search/filter sidebar.
            */}
            <ForumHighlights threads={threads} />
        </div>
    );
}
