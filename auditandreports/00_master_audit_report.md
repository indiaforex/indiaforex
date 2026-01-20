# Master Audit Report: Indian Market Board (V1 Readiness)

**Date**: 2026-01-20
**Target**: V1 Production Release

## 1. Executive Summary
The **Indian Market Board** is architecturally sound, leveraging a modern **Next.js 16 + Supabase** stack. It follows good security practices (RLS, Server Actions) and has a clean UI codebase. However, there are **3 Critical Issues** (Data Integrity & UI Bugs) and several **High Priority** improvements needed before a public V1 launch.

**Overall Health Score**: 🟢 **Good** (with specific hot-spots).

## 2. Critical Findings (Showstoppers)

### 🔴 1. Poll Voting Race Condition (Data Loss)
-   **Issue**: `voteOnPoll` reads the entire JSON options, modifies it in RAM, and writes it back. Concurrent votes will overwrite each other.
-   **Fix**: Normalize votes or use atomic SQL updates.
-   *Reference*: `03_database_design.md`

### 🔴 2. "Invisible Grandchildren" (UI Bug)
-   **Issue**: The Comment Section only renders 2 levels deep (Root -> Reply). If a user replies to a reply, it is saved in the DB but **never shown in the UI**.
-   **Fix**: Implement recursive rendering or flattened reply lists.
-   *Reference*: `05_forum_thread_system.md`

### 🔴 3. Vestigial Authentication Conflict
-   **Issue**: `package.json` includes `next-auth` and `middleware.ts` imports it, but the app uses Supabase Auth.
-   **Fix**: Remove `next-auth` to prevent confusion and bloat.
-   *Reference*: `02_tech_stack_strategy.md`

## 3. High Priority Improvements

### 🟡 Missing "Mention" Feature
-   **Gap**: The schema supports `type='mention'` notifications, but no code exists to parse `@username` and trigger them.
-   *Impact*: Reduced community engagement.

### 🟡 Database Performance
-   **Gap**: Missing indexes on Foreign Keys (`category`, `author_id`, `thread_id`).
-   *Impact*: Slow queries as data grows.

### 🟡 Operational Safety
-   **Gap**: Admin "Delete" actions perform **Hard Deletes**.
-   *Impact*: Accidental data loss is irreversible.
-   **Gap**: No structured logging or global error boundary.

## 4. Consolidated V1 Roadmap

| Priority | Task | Description |
| :--- | :--- | :--- |
| **P0** | **Fix Polls** | Rewrite `voteOnPoll` to use `atomic` increments or normalized count queries. |
| **P0** | **Fix Comments** | Refactor `CommentSection.tsx` to recursive rendering to show deep replies. |
| **P0** | **Clean Auth** | Remove `next-auth` dependencies and clean `middleware.ts`. |
| **P1** | **Add Indexes** | Add SQL indexes for all Foreign Keys in `forum` tables. |
| **P1** | **Mentions** | Implement `@mention` parsing in `createComment` / `createThread`. |
| **P1** | **Soft Deletes** | Change `delete` actions to set `hidden=true` or `deleted_at=now()`. |
| **P2** | **Observability** | Install Sentry/Pino and add `global-error.tsx`. |
| **P2** | **TradingView** | Improve Widget cleanup to prevent memory leaks. |

## 5. Artifacts Index
Detailed reports for each section can be found in `auditandreports/`:
-   `01_system_overview.md`
-   `02_tech_stack_strategy.md`
-   `03_database_design.md`
-   `04_notification_mention_system.md`
-   `05_forum_thread_system.md`
-   `06_admin_moderation_system.md`
-   `07_complex_logics_features.md`
-   `08_logging_and_operations.md`
