# Infrastructure & Operations Audit

## 1. Logging Strategy
-   **Current State**: "Printf Debugging". Reliance on `console.error` and `console.log` in `catch` blocks.
-   **Issues**:
    -   **No Central Aggregation**: In production (Vercel), these logs end up in the runtime logs but are hard to query/alert on.
    -   **Client-Side Invisibility**: `console.error` on the client (browser-side) is visible only to the user, not the developer, unless an Exception Catcher is used.

## 2. Error Handling
-   **Boundaries**: No `global-error.tsx` or granular `error.tsx` files found in the root `src/app`.
    -   *Risk*: If a Server Component throws, the entire page might crash (500) instead of showing a "Something went wrong" section.
-   **API Handling**: Server Actions return `{ error: string }`. This is a good pattern for typed handling, but requires the UI to check `if (res.error)` everywhere.

## 3. Monitoring & Observability
-   **Missing**: No Sentry, LogRocket, or Datadog integration.
-   **Supabase**: Provides database logs (slow queries, auth events). This is the only "backend" monitoring currently available.

## 4. V1 Readiness Checklist

### Critical Gaps
1.  [ ] **Global Error Boundary**: Create `src/app/global-error.tsx` to catch root crashes.
2.  [ ] **Structured Logging**: Introduce a simple logger (e.g. `pino`) for server-side logs to format as JSON (better for log ingestion).
3.  [ ] **Client Exception Tracking**: Install Sentry or similar to catch "White Screen of Death" issues in the React app.

### Performance
-   **Vercel Analytics**: Enable "Vercel Analytics" (Web Vitals) for simple frontend monitoring.
