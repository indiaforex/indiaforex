# System Overview & Architecture

## 1. High-Level Architecture
The **Indian Market Board** is a modern web application built for financial tracking, discussion, and analysis. It employs a **Serverless Architecture** relying heavily on **Next.js** for the application layer and **Supabase** for the backend-as-a-service (BaaS) layer.

### Architecture Diagram (Conceptual)
```mermaid
graph TD
    User[User - Browser] --> CDN[Edge Network / Vercel]
    CDN --> NextApp[Next.js App Router (SSR/Client)]
    
    subgraph "Frontend Layer (Next.js 16)"
        NextApp --> Components[UI Components (Radix + Tailwind)]
        NextApp --> AuthContext[Auth Provider]
        NextApp --> SWR[SWR Data Fetching]
    end
    
    subgraph "Backend Services (Supabase)"
        NextApp --"Supabase JS Client"--> SupaAuth[Authentication (GoTrue)]
        NextApp --"REST / Realtime"--> SupaDB[PostgreSQL Database]
        NextApp --> Realtime[Realtime Subscriptions]
    end
    
    subgraph "External Integrations"
        NextApp --> Yahoo[Yahoo Finance API]
        NextApp --> TradingView[TradingView Widgets]
    end
```

## 2. Key Subsystems

### A. Frontend Application
- **Framework**: Next.js 16.1.1 (App Router).
- **Language**: TypeScript.
- **Styling**: Tailwind CSS v4 with Radix UI primitives.
- **State Management**: React Context (`AuthProvider`) + `swr` for data caching/revalidation.

### B. Backend & Database
- **Platform**: Supabase.
- **Database**: PostgreSQL with `pgvector` (potential future use) and `uuid-ossp`.
- **Security Logic**: Heavily reliant on Row Level Security (RLS) policies defined directly in PostgreSQL.
- **API**: Auto-generated REST API via PostgREST + Realtime Websockets.

### C. Authentication (Critical Finding)
- **Primary Method**: Supabase Auth (Email/Password, potentially OAuth).
- **Anomaly Identified**: The project contains artifacts of both **NextAuth.js** and **Supabase Auth**.
    - `middleware.ts` attempts to use Supabase session management.
    - `package.json` includes `next-auth`.
    - This suggests a migration in progress or a confused implementation. **(See Tech Stack Report for details)**.

## 3. Directory Structure Analysis
- `src/app`: App Router pages and layouts.
- `src/components`: UI components, likely organized by domain (e.g., `forum`, `dashboard`).
- `src/lib`: Core logic, Supabase clients (`src/lib/supabase`), and utility functions.
- `src/context`: React Context providers (Auth).
- `supabase_schema.sql`: Source of truth for database schema and security policies.

## 4. Operational Flows
1.  **User Access**: Protected via Middleware (`updateSession`) and RLS.
2.  **Data Flow**: 
    - **Reads**: Direct calls to Supabase or via Server Components.
    - **Writes**: Client-side calls to Supabase, triggered by user actions, guarded by RLS.
3.  **Real-time Updates**: Forum comments and Notifications likely use Supabase Realtime channels.
