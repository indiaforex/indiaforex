# Administration & Moderation System Audit

## 1. Security Architecture
-   **Pattern**: Server-Side Enforcement via `ensureAdmin()` in `src/lib/moderation.ts`.
-   **Checks**: Fetches user profile roles (`admin` | `super_admin`) directly from DB before executing any mutation.
-   **Client-Side**: `src/app/admin/page.tsx` performs redirects for UX, but actual security relies on the server actions. **Verdict: Secure.**

## 2. Moderation Features
-   **Workflow**:
    1.  User Reports Content -> `forum_reports` (status: pending).
    2.  Admin Views Reports -> Resolves or Dismisses.
    3.  Actions:
        -   **Ban User**: Sets `is_banned = true`. (Effective immediately due to RLS).
        -   **Delete Content**: Performs **Hard Delete** (`DELETE FROM`).

### Issues & Observations
-   **Hard Deletes**: Content is permanently removed.
    -   *Risk*: If an admin accidentally deletes the wrong thread, it's gone (unless DB backups exist).
    -   *Recommendation*: Implement "Soft Deletes" (`deleted_at` timestamp column) to allow undo/review, or strictly archive deleted content to a separate table.
-   **Ban Impact**: Banning a user prevents *new* posts (RLS check `not exists is_banned`).
    -   *Question*: Does it hide their *old* posts?
    -   *Answer*: **No**. RLS policies for `select` are `true` (public). Old posts remain visible. This is usually desired behavior.

## 3. Audit Logging
-   **Mechanism**: `admin_logs` table.
-   **Triggers**: `logAdminAction` helper called manually in every mutation.
-   **Coverage**:
    -   `resolve_report`: ✅
    -   `ban_user`: ✅
    -   `delete_content`: ✅
-   **Verdict**: Robust audit trail.

## 4. Recommendations for V1
1.  **Soft Deletes**: Switch to `is_deleted` flag for Thread/Comment deletion to prevent data loss accidents.
2.  **Ban Clarity**: Add a visual indicator on posts from banned users (e.g., "User Banned"), or hide their profile.
