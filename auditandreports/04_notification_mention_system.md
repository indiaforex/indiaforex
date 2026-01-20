# Notification & Mention System Audit

## 1. System Architecture
- **Type**: Real-time Push + Persistent History.
- **Backend**: PostgreSQL `notifications` table populated via Triggers.
- **Frontend**: `NotificationBell.tsx` component using Supabase Realtime channels.

### Data Flow
1.  **User Action**: User A replies to User B's thread.
2.  **DB Trigger**: `handle_new_comment_notification` fires on `forum_comments` INSERT.
3.  **Record Creation**: A new row is inserted into `notifications` for User B.
4.  **Realtime Event**: Supabase pushes `INSERT` payload to User B's open socket.
5.  **UI Update**: `NotificationBell` receives event -> Shows Toast -> Increments Badge.

## 2. Issues & Findings

### A. 🔴 Missing "Mention" Logic
The schema supports a notification type `'mention'`, but there is **no implementation** to detect or generate this.
-   **Current State**: The DB trigger only checks `thread_owner` and `parent_comment_owner`.
-   **Gap**: If User A writes "Hey @UserB check this out", User B gets **no notification** unless they are the OP or parent.
-   **Recommendation**: Implement a regex parser (`@(\w+)`) in the `createComment`/`createThread` Server Action (or a more complex PL/pgSQL function) to lookup target users and insert notification records.

### B. Realtime "Waterfall" Fetch
In `NotificationBell.tsx`:
```typescript
.on('postgres_changes', ..., async (payload) => {
    // ⚠️ Network Request triggered immediately upon event
    const { data } = await supabase.from('notifications').select(...).eq('id', payload.new.id)...
})
```
-   **Impact**: Good for receiving "hydrated" data (username/avatar) which isn't in the raw payload.
-   **Risk**: Low. This is standard pattern. Only problematic if a user receives 100s of notifications/second (DDoS or viral event).

### C. "Mark as Read" User Experience
-   **Current**: Opening the popover marks **all** notifications as read immediately.
-   **Critique**: Standard behavior, but sometimes users prefer to mark individual items or "Mark all" explicitly.
-   **Verdict**: Acceptable for V1.

## 3. UI/UX Analysis
-   **Visuals**: Clean implementation using `lucide-react` Bell and `sonner` Toasts.
-   **Badge**: Animated pulse provides good attention grabber.
-   **Feedback**: Toast notification provides immediate feedback even if the bell is off-screen (though bell is usually sticky).

## 4. Improvements for V1
1.  **Implement Mentions**: Critical for community engagement.
2.  **Group Notifications**: If 10 people like a post, show "User A and 9 others liked..." instead of 10 separate rows. (Requires schema change or complex query logic).
