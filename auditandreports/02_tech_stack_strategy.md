# Tech Stack & Strategy for V1

## 1. Current Context
The specific technologies chosen for `indian-market-board` represent a "Modern Stack" heavily leaning into the Next.js ecosystem.

| Layer | Technology | Status |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.1.1** (App Router) | ✅ Cutting Edge |
| **Language** | **TypeScript 5** | ✅ Standard |
| **Backend / DB** | **Supabase** (Postgres, GoTrue) | ✅ Scalable |
| **Styling** | **Tailwind CSS v4** + **Radix UI** | ✅ Modern & Accessible |
| **State** | **SWR** + React Context | ⚠️ Evaluation Needed (See Strategy) |

## 2. Dependency Audit & Health Check

### Critical Issues (Action Required)
> [!WARNING]
> **Mixed Authentication Libraries detected.** 
> The project includes `next-auth` (v4.24.13) in `package.json` and imports it in `middleware.ts`, but the actual application logic (`AuthProvider.tsx`, `supabase/middleware.ts`) exclusively uses **Supabase Auth**.
>
> **Action**: Remove `next-auth` validation to reduce bundle size and confusion.

### Key Libraries
- **`@supabase/ssr` (^0.8.0)**: Correct, modern way to handle Supabase in Next.js App Router (replaces older `auth-helpers`).
- **`yahoo-finance2`**: Critical for market data. Reliance on a 3rd party open-source scraper wrapper is a risk for production stability.
- **`recharts`**: Good choice for visualization, D3-based but easier.
- **`sonner`**: Excellent, lightweight toast notifications.

## 3. Strategy for Version 1 Production

### A. Authentication durability
- **Goal**: Zero reliance on vestigial libs. 
- **Plan**: 
    1. Uninstall `next-auth`. 
    2. refactor `middleware.ts` to remove unused imports. 
    3. Ensure `src/lib/supabase/server.ts` handles cookie refreshing correctly (as verified in `middleware.ts`).

### B. Data & State Management
- **Current**: Heavy client-side fetching with `swr` inside `useEffect` in components or custom hooks.
- **V1 Strategy**: 
    - Move initial data fetching to **Server Components** where possible (SEO wins).
    - Use `swr` or `tanstack-query` *only* for live/polling data (e.g., stock prices).
    - Use **Server Actions** for all mutations (Form submissions, Likes, Posts) to reduce client JS and simplify error handling.

### C. External API Risk
- **Issue**: `yahoo-finance2` is unofficial.
- **Mitigation**:
    - Wrap all external calls in a caching layer (Next.js `unstable_cache` or Supabase Edge Functions with Redis).
    - Failure fallback: If Yahoo fails, show stale data or a "Market data unavailable" graceful UI state, rather than 500 errors.

### D. CSS/Styling
- **Tailwind v4** is bleeding edge. Ensure build pipeline (PostCSS) is stable.
- **recommendation**: Stick with it, performance gains are worth it.
