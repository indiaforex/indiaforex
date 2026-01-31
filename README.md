# IndiaForex Market Institutional Terminal

# Visit the Deployment at https://indiaforex.vercel.app/
# Visit the Repo at https://github.com/indiaforex/indiaforex/

> **A high-performance financial intelligence platform bridging institutional-grade market data with community-driven insights.**

## 1. System Architecture

The project adopts a **Serverless Hybrid Architecture**, leveraging **Next.js 15 (App Router)** for the frontend and **Supabase (PostgreSQL)** for the backend. It prioritizes "Zero-Click Latency" and real-time data synchronization.

### **Core Stack**
*   **Frontend:** Next.js 15.1, React 19, Tailwind CSS v4, Framer Motion.
*   **Database:** PostgreSQL 15 (Supabase) with `uuid-ossp` extension.
*   **Auth:** Supabase Auth (JWT + RLS) with Google/GitHub/Twitter OAuth providers.
*   **State Management:** Server Actions for mutations, `unstable_cache` (ISR) for data fetching, and optimistic UI updates.

### **Realtime Event Architecture**
The application actively utilizes **Supabase Realtime (WebSockets)** to broadcast state changes instantly to connected clients.
*   **Pub/Sub Model:** The PostgreSQL database acts as the single source of truth, broadcasting `INSERT`, `UPDATE`, and `DELETE` events via the `supabase_realtime` publication.
*   **Active Channels:**
    *   `notifications`: Users receive instant alerts (toast + bell badge) when mentioned or replied to, without refreshing.
    *   `forum_comments`: Thread discussions update live as new comments are posted by other users.
    *   `forum_categories`: Category structure updates propagate instantly (metadata sync).
*   **Client-Side Subscription:** Implemented via `supabase.channel().on('postgres_changes', ...)` hooks in React components (`NotificationBell.tsx`, `CommentSection.tsx`).

### **Data Pipeline Strategy**
The application employs a dual-pipeline strategy for data delivery:

1.  **Cold Storage (CMS/Editorial):** Using **Google Sheets via SheetDB** as a headless CMS for the Economic Calendar.
    *   **Dual-Write Workflow:**
        *   **Direct:** Admins can edit the Google Sheet directly.
            > <img width="800" height="325" alt="image" src="https://github.com/user-attachments/assets/091acc08-2e17-4400-978b-83f75330612c" />
        *   **Application:** Users with the specialized `event_analyst` role can use the **Admin Panel > Events** form to append rows to the sheet via API.
            > <img width="800" height="390" alt="image" src="https://github.com/user-attachments/assets/20dde580-a6f7-41e0-8ad7-bc80c710e49a" />
    *   **Read Path:** Data is cached at the edge using Next.js ISR tags (`revalidate: 60`), ensuring site resilience even if the SheetDB API is rate-limited.
    > <img width="800" height="728" alt="image" src="https://github.com/user-attachments/assets/21791a69-3b07-4242-b297-165597a36db2" />
 
2.  **Hot Storage (Market Data):** Real-time fetching via `yahoo-finance2` on the server, protected by a 15-second deduplication cache (`unstable_cache`) to prevent rate-limiting while serving thousands of concurrent users.

---

## 2. Technical Features

### **Command Center & Dashboard**
> <img width="800" height="407" alt="image" src="https://github.com/user-attachments/assets/a32c685e-8dee-4781-9d09-04e301b1169a" />

*   **Global Market Watch:** Aggregates real-time indices (NIFTY, SENSEX, NASDAQ) using server-side fetching.
    > <img width="800" height="991" alt="image" src="https://github.com/user-attachments/assets/f2d3419b-7f6c-4f85-b5b2-5ea19d0b9687" />
*   **Algorithmic Scanner:** "Live Market Scanner" component runs simple heuristics (Gap Up, Volume Shock) on fetched payloads to surface opportunities instantly.
    > <img width="800" height="271" alt="image" src="https://github.com/user-attachments/assets/4842dea6-82fc-418c-9c90-245a98ee60b6" />
*   **Sector Heatmap:** Visualizes relative performance of top 10 constituents using color scales effectively.
    > <img width="800" height="466" alt="image" src="https://github.com/user-attachments/assets/16da8ee2-dd65-49c8-8da9-de18dbfc03f8" />


### **Community Engine (The "Alpha" Core)**
A from-scratch social platform built directly on Postgres.
> <img width="800" height="407" alt="image" src="https://github.com/user-attachments/assets/353a37e9-6d00-43f2-9658-99b59294d0e8" />


*   **Recursive Threading:** Supports infinite nesting for deep discussions.
    > <img width="800" height="303" alt="image" src="https://github.com/user-attachments/assets/a21c00b1-2ff8-4f64-9c11-0921387c7e41" />
*   **Reputation System:**
    *   **Logic:** Implemented via **PostgreSQL Triggers**, ensuring atomicity. Every `Like` or `Comment` fires a database function to update the user's `reputation_points`.
    *   **Security:** Users cannot "game" the system; points are managed entirely by DB constraints, invalidating points if content is deleted.
*   **Role-Based Access Control (RBAC):**
    *   Hierarchy: `Guest` > `User` > `High Level` > `Steward` > `Event Analyst` > `Admin` > `Super Admin`.
    *   **Stewards:** Can moderate *only* specific categories (e.g., "Crypto Steward" cannot moderate "Forex").

---

## 3. Engineering Challenges & Workarounds

### **A. Role Integration with Supabase RLS**
**Problem:** Supabase Auth handles authentication (identity), but our application relies on complex authorization (roles like `super_admin`) stored in a public `profiles` table.
**Solution:**
*   We use a **Trigger-based Sync** (`handle_new_user`) to auto-create a profile row upon signup.
*   **Hybrid RLS Policies:** Policies don't just check `auth.uid()`; they perform efficient sub-queries to the `profiles` table to check roles.
    ```sql
    -- Example Policy: Admins can update any thread
    create policy "Admins can update any thread"
      on forum_threads for update
      using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin')) );
    ```
*   **Fix Implemented:** We had to explicitly `DROP` and recreate policies to ensure Admin overrides took precedence over standard "User can edit own post" policies, solving a "Forbidden" error for admins.

### **B. TradingView Integration in React**
> <img width="800" height="293" alt="image" src="https://github.com/user-attachments/assets/a1e900e5-888b-4269-a9a9-2648cb29ded3" />
**Problem:** The TradingView "Advanced Chart" widget relies on strictly imperative script injection and often throws `iframe contentWindow` errors when unmounted rapidly (e.g., during React Fast Refresh or tab switching).
**Solution:**
*   Wrapped the widget in a `memo`ized component with strictly controlled dependency arrays.
*   Implemented a ref-based cleanup specifically targeting the script element to ensure clean unmounting.
*   Used a specific container `id` generation strategy to avoid DOM collisions during re-renders.

### **C. The "Google Sheets as Backend" Pattern**
**Problem:** Operations team needed to update "Economic Events" faster than a database admin panel could be built/deployed.
**Solution:**
*   Implemented `sheetdb.ts` adapter.
*   **Optimization:** Configured Next.js to cache the SheetDB response for 60 seconds (`revalidate: 60`). This prevents hitting Google's strict API quotas while keeping the calendar "fresh enough" for macro news.
*   **Resilience:** The adapter includes specific error handling for non-array responses, preventing the dashboard from crashing if the Sheet format is temporarily broken by a human editor.

---

## 4. Key Security Implementation
*   **Row Level Security (RLS):** 100% of database access is protected by RLS. No server-side "service role" bypass is used for standard user actions.
*   **XSS Protection:** Comments are sanitized using `rehype-sanitize` before rendering to prevent script injection in the rich text editor.

---

## 5. Future Roadmap (Technical)
*   Migration of `sheetdb` to a proper Postgres Table once the schema stabilizes or the operators get technically sound.
*   Implementation of WebSocket subscriptions for "Live Ticker" pushing (currently polling/cached).
