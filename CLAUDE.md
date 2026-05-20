# Project: project-0.1-v2

## Stack
- Next.js 14.1, React 18, TypeScript, CSS Modules (no Tailwind)
- Supabase (auth + optional DB storage via @supabase/ssr)
- Deployed on Vercel
- Fonts: Space Grotesk (--font-space), JetBrains Mono (--font-mono)

## Architecture
- Auth: @supabase/ssr, cookie-based sessions, middleware.ts gates all (app)/* routes
- Storage: dual adapter — localStorage (default) or Supabase (NEXT_PUBLIC_USE_SUPABASE_STORAGE=true)
- Service layer: src/lib/services.ts (sealDay, initializeFromOnboarding, commitPreset)
- Data wrappers: src/lib/presets.ts (all storage operations go through here, never call getStorage() from pages)
- Types: src/lib/types.ts (domain), src/lib/supabase/types.ts (DB)
- Ranks: src/lib/ranks.ts (12 tiers, thresholds, computeRankFields derives rank from XP)
- Shared hooks: src/hooks/useRankData.ts (both /today and /rank use this)

## Key Conventions
- Business logic goes in src/lib/ not in page components
- Always use getUser() not getSession() for auth checks
- New Supabase tables need RLS policies
- Use the storage adapter pattern for new data — not direct Supabase calls from pages
- Default UserProgress: use createDefaultUserProgress() from presets.ts — never hardcode rank/XP values
- All page data fetching uses useEffect with [] deps — AppShellClient uses key={pathname} to force remount on navigation
- CSS Modules only — no Tailwind. Use CSS vars from globals.css (--glass-bg, --glass-border, --ease-out-expo, etc.)
- Page headers: monospace accent label (e.g. "// MISSION LOG") + gradient title — use {'// TEXT'} to escape the // in JSX
- Animations: use transform/opacity only (GPU composited). Spring easing: cubic-bezier(0.34, 1.56, 0.64, 1)

## Design System
- Strict red/black palette (single source of truth in globals.css). Core CSS vars:
  --bg #080808, --surface #111111, --surface-raised #1a1a1a, --border #222222,
  --accent (red) #E0002B, --accent-hover/--warning #FF1744, --text-primary #FFFFFF,
  --text-secondary #AAAAAA (labels), --text-muted #555555, --danger #8B0000
- Convention: black text on red accent (e.g. buttons use `color: var(--bg)` on `background: var(--accent)`)
- Legacy `[data-theme="green"]` / `"blue"` aliases remain but both resolve to the red palette
- Cards: solid --surface / --surface-raised with --border, subtle shadow (no glass/blur)
- Entrance: fadeInUp animation with staggered delays (80ms increments)
- Interactions: spring easing on hover/active, dopamine checkbox animations (ripple + glow burst + badge punch)
- Reduced motion: @media (prefers-reduced-motion: reduce) disables all animations globally
- Mobile: reduce backdrop-filter to blur(4px) for performance

## Completed Work
- Full 25-point audit (April 2026) — all CRITICAL/HIGH/MEDIUM/LOW resolved
- Bug fixes: rank sync, navigation data loading
- Rank system: 12 tiers with XP progression, shared useRankData hook, premium UI
- Full UI redesign: glass-morphism, entrance animations, ambient atmosphere across all pages
- Typography: unique monospace accent labels + gradient text on all page headers
- Dopamine interactions: bouncy checkboxes, completion flash, badge punch animations

## Current Focus
[update this each session]
