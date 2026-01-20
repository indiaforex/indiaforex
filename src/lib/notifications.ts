import { createClient } from "@/lib/supabase/server";

export async function processMentions(
    content: string,
    resourceId: string,
    resourceType: 'thread' | 'comment',
    actorId: string,
    resourceSlug?: string // For threads, this might be the thread ID itself. For comments, the thread ID.
) {
    try {
        const supabase = await createClient();

        // 1. Extract unique usernames
        const mentionRegex = /@(\w+)/g;
        const matches = [...content.matchAll(mentionRegex)];
        const usernames = [...new Set(matches.map(m => m[1]))];

        if (usernames.length === 0) return;

        // 2. Resolve to User IDs
        const { data: mentionedUsers } = await supabase
            .from('profiles')
            .select('id, username')
            .in('username', usernames);

        if (!mentionedUsers || mentionedUsers.length === 0) return;

        // 3. Create Notifications
        const notifications = mentionedUsers
            .filter(u => u.id !== actorId) // Don't notify self
            .map(u => ({
                user_id: u.id,
                actor_id: actorId,
                type: 'mention' as const,
                resource_id: resourceId,
                resource_slug: resourceSlug || resourceId, // Fallback
                content_preview: content.substring(0, 50),
                is_read: false
            }));

        if (notifications.length > 0) {
            const { error } = await supabase.from('notifications').insert(notifications);
            if (error) {
                console.error("Error creating mention notifications:", error);
            }
        }

    } catch (error) {
        console.error("Error processing mentions:", error);
    }
}
