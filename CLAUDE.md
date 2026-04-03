# Project: project-0.1-v2

## Stack
- Next.js 14.1, React 18, TypeScript, Tailwind
- Supabase (auth + optional DB storage)
- Deployed on Vercel

## Architecture
- Auth: @supabase/ssr, cookie-based sessions, middleware.ts gates all (app)/* routes
- Storage: dual adapter — localStorage (default) or Supabase (NEXT_PUBLIC_USE_SUPABASE_STORAGE=true)
- Service layer: src/lib/presets.ts
- Types: src/lib/types.ts (domain), src/lib/supabase/types.ts (DB)

## Key Conventions
- Business logic goes in src/lib/ not in page components
- Always use getUser() not getSession() for auth checks
- New Supabase tables need RLS policies
- Use the storage adapter pattern for new data — not direct Supabase calls from pages

## Completed Work
- Full 25-point audit complete (April 2026)
- All CRITICAL/HIGH/MEDIUM/LOW issues resolved

## Current Focus
[update this each session]
