# Project 0.1 v2

Foundation setup for Project 0.1 v2.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Supabase (client configured, no project created yet)
- Vercel deployment target

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. (Optional) Add Supabase environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Note: Supabase environment variables are optional in Phase 1. The app will run without them.

4. Run development server:
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type check
- `npm run ci:check` - Run all CI checks (lint + typecheck + build)

## Environment Variables

See `.env.example` for available environment variables. All Supabase variables are optional in Phase 1.

## CI/CD

GitHub Actions runs on push to main and pull requests:
- Lint check
- Type check
- Build verification

## Deployment

This project is configured for Vercel deployment. No `vercel.json` is needed for standard Next.js deployments.

## Phase 1 Status

- ✅ Project structure initialized
- ✅ TypeScript and Next.js configured
- ✅ Linting and formatting setup
- ✅ Supabase client configured (browser + server)
- ✅ Health check endpoint (`/api/health`)
- ✅ CI/CD pipeline configured
- ✅ Migration structure prepared

No UI features, product pages, or database schema have been created yet.
# project-0.1-v2
