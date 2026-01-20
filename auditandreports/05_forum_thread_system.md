# Forum & Thread System Analysis

## 1. Comment System Architecture
-   **Data Model**: Adjacency List (`parent_id` in `forum_comments` table).
-   **Fetching Strategy**: "Fetch All" (Non-paginated) on the client side.
-   **Rendering**: Client-side reconstruction of the tree.

## 2. 🔴 CRITICAL: The "Invisible Grandchildren" Bug
**Location**: `src/components/forum/CommentSection.tsx`
**Severity**: High (Data Visibility Issue)

**Logic Flaw**:
The component only iterates two levels deep:
```tsx
rootComments.map(comment => (
    // Level 1
    <CommentItem ...>
        {getReplies(comment.id).map(reply => (
            // Level 2 (Direct children of Level 1)
            <CommentItem ... />
        ))}
    </CommentItem>
))
```

**Scenario**:
1.  User A posts a Root Comment (ID: 1). Visible.
2.  User B replies to ID: 1 (ID: 2, parent: 1). Visible (Level 2).
3.  User C replies to ID: 2 (ID: 3, parent: 2).
    -   **Result**: ID: 3 is **NOT RENDERED**. The code never looks for children of `reply`.
    -   **Fix**: Either support infinite recursion (Component calls itself) or Flatten all replies to the Root Parent (like Reddit's "continue this thread" or simplified logic where `parent_id` is always the root comment).

## 3. Performance Bottlenecks
-   **Render Complexity**: `O(N^2)`. For every root comment, it iterates through the entire comment list to find replies.
    -   *Impact*: With < 100 comments, negligible. With 1000 comments, noticeable lag on typing/interaction.
    -   *Improvement*: Pre-process comments into a Map/Tree structure `Record<string, Comment[]>` on component mount. O(N).
-   **No Pagination**: Fetches entire history. Memory and Bandwidth heavy for popular threads.

## 4. Rich Text & Media
-   **Editor**: `@uiw/react-md-editor` (inferred from `package.json` and imports).
-   **Rendering**: `CommentItem.tsx` uses a Markdown previewer.
-   **Security**: Need to ensure the Markdown renderer sanitizes HTML (e.g. `rehype-sanitize`) to prevent XSS (Stored XSS). *Verification pending on strict configuration check.*

## 5. Interaction Logic
-   **Realtime**: Good implementation, but suffers from "Waterfall" fetching of author profiles for every new comment.
-   **Optimistic Updates**: Not fully utilized. The UI waits for the Realtime event to loop back before showing the new comment, which can feel sluggish (>200ms lag).

## 6. Recommendations for V1
1.  **Fix Nesting**: Implement recursive rendering or force flat replies.
2.  **Pagination**: Implement `Load More` or `Cursor-based` pagination for comments.
3.  **Sanitization**: Enforce strict HTML sanitization on Markdown output.
4.  **Optimistic UI**: Append comment locally immediately upon 'Send', then reconcile with Realtime.
