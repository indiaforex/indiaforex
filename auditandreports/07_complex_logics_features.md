# Complex Logics & Features Audit

## 1. TradingView Integration
**Component**: `src/components/ui/TradingViewWidget.tsx`

### Architecture
-   **Method**: Script Injection (`<script>`).
-   **Container**: Uses a `ref` (`container`) to append the script.
-   **Lifecycle**:
    -   `useEffect` to create script.
    -   **Issue**: It clears `container.current.innerHTML = ""` on *mount* (which is good) but **does not appear to have a cleanup function** (`return () => ...`) that safely removes the script or listeners when unmounting.
    -   *Risk*: Memory leaks or "orphan" iframe events if the component toggles rapidly.
    -   *Stability*: The manual `innerHTML` clearing is a brute-force way to handle re-renders (strict mode), which works but is slightly "hacky".

### Recommendation
-   Use a proven wrapper library (like `react-ts-tradingview-widgets`) OR implement a robust cleanup that removes the specific script tag and message listeners.

## 2. Reputation System
**Distribution**: Hybrid (DB + App Logic).

### Logic Flow
1.  **Points Earning** (Database Native):
    -   Triggers (`on_like_received_rep`) handle points.
    -   *Pros*: Consistent. Impossible to "miss" a point update if DB transaction succeeds.
    -   *Cons*: Hidden from codebase logic (Magic behavior).

2.  **Gating / Spending** (App Logic):
    -   `src/lib/forum.ts`: Checks `profile.reputation_points < GATE` before allowing actions (Polls, Links).
    -   *Pros*: Clear business logic in TypeScript.

### Findings
-   **Consistency**: Excellent. Usage of `ensureAdmin` pattern alongside Reputation Gates ensures a secure environment.
-   **Scaling**: Trigger-based updates are fast for now, but high-concurrency "Viral" posts (1000 likes/sec) might cause row lock contention on the `profiles` table.
    -   *Advancement*: Move reputation updates to a background worker (pg_cron or external queue) for eventual consistency.

## 3. Auth & Session Management (Complex Flow)
Only standard flows found. The previous "Mixed Auth" finding (Phase 1) is the only major complexity/risk here.
