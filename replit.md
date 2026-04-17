# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project: AI Smart Diet & Fitness Assistant

### Architecture
- **Frontend**: React + Vite at `artifacts/diet-fitness-app/` (mobile-first, max-w-md)
- **Backend**: Express API at `artifacts/api-server/` with OpenAI GPT integration
- **Database**: PostgreSQL with Drizzle ORM at `lib/db/`
- **API Contract**: OpenAPI spec at `lib/api-spec/openapi.yaml` → codegen to `lib/api-client-react/`

### Pages (all in `artifacts/diet-fitness-app/src/pages/`)
- `onboarding.tsx` — User profile creation (name, age, height, weight, diet pref, activity, goal)
- `dashboard.tsx` — Home with streak, quick actions, today's summary
- `diet.tsx` — AI-generated diet plans with WHY explanations per meal
- `workout.tsx` — AI-generated workout plans with WHY explanations per exercise
- `scanner.tsx` — AI food nutrition analyzer (food name + quantity input)
- `nearby.tsx` — Budget-based food finder with nutrition scoring
- `tracking.tsx` — Daily log: meal checklist, workout check, weight entry
- `progress.tsx` — Charts: weight trend, compliance bar chart, day-dot heatmap

### Theme
Warm earthy greens: `--primary: 85 40% 35%`, background warm off-white

### Key Design Patterns
- All pages check `localStorage.getItem("userId")` and redirect to `/` if missing
- Explainable AI: every meal/exercise has a `why` field shown on expand (tap to reveal)
- Adaptive AI: diet/workout generation reads yesterday's tracking to adapt notes
- API hooks from `@workspace/api-client-react` (generated from Orval)
- Hook signatures: `useGetDietPlans(userId, params?, options?)` — many hooks take `(userId, options?)` without params

### Codegen Quirk
After running codegen, `lib/api-zod/src/index.ts` gets overwritten — it must only export `generated/api`, not `types`.

### DB Schema (lib/db/src/schema/)
- `users.ts` — users table with BMR/TDEE fields
- `diet-plans.ts` — daily diet plans with JSON meals array
- `workout-plans.ts` — daily workout plans with JSON exercises array
- `tracking-logs.ts` — daily tracking log with compliance metrics
- `food-items.ts` — food database (seeded with 20 Indian foods)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
