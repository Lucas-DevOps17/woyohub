# WOYOhub — Development Log

> Personal LMS + skill progression engine with gamification.
> Track courses, build projects, follow career roadmaps, and level up.

**Live:** [woyohub.vercel.app](https://woyohub.vercel.app)
**Repo:** [github.com/Lucas-DevOps17/woyohub](https://github.com/Lucas-DevOps17/woyohub)

---

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Frontend    | Next.js 14 (App Router), Tailwind CSS         |
| Design      | "Intellectual Ascent" system — Manrope + Inter |
| Backend     | Supabase (PostgreSQL, Auth, RLS)              |
| Auth        | Supabase Auth (Google OAuth + Email/Password) |
| State       | TanStack Query + Zustand (planned)            |
| Deployment  | Vercel (auto-deploy on push)                  |

---

## Design System: "The Intellectual Ascent"

The UI follows a custom design specification (`DESIGN.md`) inspired by editorial gallery aesthetics:

- **No borders** — surfaces defined by tonal background shifts (`#faf8ff` → `#f3f2ff` → `#ffffff`)
- **Dual typeface** — Manrope (display/headlines) + Inter (body/utility)
- **Gradient progress bars** — tertiary green-to-mint (`#006631` → `#62ff96`) for completion, primary blue for in-progress
- **Ambient tinted shadows** — `rgba(0,73,219,0.06)`, never pure black
- **Pill buttons** — `border-radius: 9999px` with gradient fills
- **Card radius** — `24px` (3xl), no visible borders
- **Dark mode** — full support via CSS custom properties and `.dark` class
- **Glassmorphic top bar** — `backdrop-filter: blur(16px)`
- **Level hero card** — dark gradient with XP progress bar
- **"Start Learning" FAB** — floating action button with gradient and shadow

---

## Build Phases

### Phase 1 — MVP ✅ Complete
- [x] Project scaffolding (Next.js + Tailwind + TypeScript)
- [x] Supabase integration (client, server, middleware)
- [x] Database schema (14 tables, RLS policies, triggers, seed data)
- [x] Auth system (Google OAuth + email/password)
- [x] Access control (email allowlist — single-user mode)
- [x] Landing page (Intellectual Ascent design)
- [x] Dashboard — Level hero, roadmap, daily momentum, active courses, skill tree, achievements, FAB
- [x] Courses page — Course library with dark headers, platform tags, progress bars, add course form
- [x] Skills page — Grid with icons, mastery levels, XP scores, progress bars
- [x] Roadmaps page — Career path cards with difficulty badges, Start/Continue buttons
- [x] Projects page — Portfolio grid with status badges, skill tags
- [x] Achievements page — Unlocked vs locked grid
- [x] Settings page — Profile editing, dark mode, integrations, danger zone
- [x] Sign out page — Confirmation with streak reminder
- [x] Responsive sidebar (mobile slide-out drawer, 6 main + 2 bottom nav items)
- [x] Glassmorphic top bar (search, streak badge, level badge, avatar)
- [x] Dark mode toggle (persisted to localStorage)
- [x] Vercel deployment with CI/CD

### Phase 2A — Dashboard Data Integration ✅ Complete (Agent 2)

Agent 2 connected the dashboard to real Supabase data:

**Data layer updates** (`app/(dashboard)/dashboard/page.tsx`):
- [x] Query for today's XP logs
- [x] Query for user's active roadmap from `user_roadmaps`
- [x] Query for recent activity (last 10 XP logs)
- [x] All new data passed to DashboardClient

**Dashboard component updates** (`components/dashboard/dashboard-client.tsx`):
- [x] Level hero — now shows "+X XP today" message
- [x] Roadmap section — fetches from `user_roadmaps` table, shows empty state if none active
- [x] Streak tracker — uses real `profile.current_streak`, `longest_streak`, `last_activity_date`; shows "On fire!" at 7+ days
- [x] Recent activity — new sidebar showing last 8 XP log entries with icons and timestamps
- [x] Dashboard layout reorganized: Hero → Roadmap+Streak → Courses+Activity → Skills+Achievements

**CSS animations** (`app/globals.css`):
- [x] Fade-in animation for page load
- [x] Pulse-glow animation for active streak days

### Phase 2B — Interactive Features ✅ Complete (Agent 3)

**Agent 3 implemented the core progression system:**

- [x] **Lesson completion flow** — Mark lesson complete → +10 XP → update `courses.completed_units` → update `user_skills.xp` → update `profiles.total_xp`
- [x] **Roadmap skill calculation** — Proper % based on `roadmap_skills` joined with `user_skills`: `progress = SUM(LEAST(user_level / required_level, 1)) / COUNT(skills) * 100`
- [x] **Project CRUD** — Create, edit, delete projects with skill tags; +100 XP on completion distributed across linked skills
- [x] **Daily login XP bonus** — +5 XP on first activity of day, streak tracking (consecutive day detection)
- [x] **Course detail page** — View lessons, mark complete with XP award, progress tracking
- [x] **RPC functions** — `increment_user_xp()`, `get_roadmap_progress()` for atomic operations
- [x] **API routes** — `/api/lessons/complete`, `/api/projects/complete`, `/api/daily-login`, `/api/roadmaps/[id]/progress`
- [x] **Progression library** — `lib/progression.ts` with reusable `awardLessonXP`, `awardProjectXP`, `awardDailyLoginXP`

**Files created/updated:**
- `lib/progression.ts` — Core XP award logic with idempotency
- `app/api/lessons/complete/route.ts` — Lesson completion endpoint
- `app/api/projects/complete/route.ts` — Project completion endpoint
- `app/api/daily-login/route.ts` — Daily login bonus endpoint
- `app/api/roadmaps/[id]/progress/route.ts` — Roadmap progress calculation
- `app/api/projects/[id]/route.ts` — Project CRUD (GET/PUT/DELETE)
- `app/(dashboard)/courses/[id]/page.tsx` — Course detail with lesson tracking
- `app/(dashboard)/projects/page.tsx` — Projects with edit/delete menu
- `app/(dashboard)/projects/new/page.tsx` — Create project form
- `app/(dashboard)/projects/edit/[id]/page.tsx` — Edit project form
- `components/dashboard/dashboard-client.tsx` — Real roadmap progress fetch + daily login trigger
- `supabase/migrations/002_progression_functions.sql` — Database RPC functions

### Phase 2C — Learning Log System ✅ Complete (Agent 4)

**Agent 4 replaced lesson-by-lesson tracking with a batch learning log system and fixed Phase 2B TypeScript build errors.**

**Bug fixes:**
- [x] `lib/progression.ts` — `total_xp` missing from profile SELECT in `awardDailyLoginXP` (caused TS error + runtime NaN)
- [x] `app/api/roadmaps/[id]/progress/route.ts` — Supabase infers `skill` join as array; added `Array.isArray` guard on `.name`/`.icon` access

**Learning log system:**
- [x] **Schema upgrade** — `learning_logs.units_completed` column; `learning_log_skills` junction table with RLS; `skills` INSERT policy for custom skill creation
- [x] **API `POST /api/courses/[id]/log`** — Atomic sequence: validate ownership → clamp units to remaining (prevent over-complete) → insert log → update course progress → link skills → award +10 XP → update user_skills per skill
- [x] **Courses page rewrite** — Client component; each card has inline "Add Lessons" form (units, summary, skill chips, new skill input); learning logs shown below card (last 3 previewed, collapse/expand for all); no lesson CRUD UI

**Files created/updated:**
- `supabase/migrations/003_learning_logs_upgrade.sql` — Schema upgrade
- `app/api/courses/[id]/log/route.ts` — Learning log submission endpoint
- `app/(dashboard)/courses/page.tsx` — Rewritten as client component with log form + log list
- `lib/progression.ts` — Fix: add `total_xp` to profile SELECT
- `app/api/roadmaps/[id]/progress/route.ts` — Fix: `Array.isArray` guard for skill join

**XP rules:**
- Learning log submission → **+10 XP** (profile)
- Each tagged skill → **+10 XP** (user_skills)

### Phase 2D — User-Created Roadmaps MVP ✅ Complete

Real roadmaps with ownership, skill requirements, and a single active enrollment per user (templates remain seeded and public).

**Schema & RLS** (`supabase/migrations/004_roadmaps_ownership_and_active.sql`):
- [x] `roadmaps.user_id` — `NULL` for seeded templates; set for user-created roadmaps
- [x] `user_roadmaps.is_active` — one active roadmap per user (partial unique index); backfill for existing rows
- [x] RLS — users can insert/update/delete only their own `roadmaps`; `roadmap_skills` writes scoped to roadmap owner

**API routes:**
- [x] `POST /api/roadmaps` — create roadmap + `roadmap_skills` (deduped skills)
- [x] `PUT` / `DELETE /api/roadmaps/[id]` — owner-only; junction replace on edit
- [x] `POST /api/roadmaps/[id]/activate` — deactivate others, then set active enrollment

**App:**
- [x] `app/(dashboard)/dashboard/page.tsx` — active roadmap query uses `.eq("is_active", true)`
- [x] `components/roadmaps/roadmap-form-modal.tsx`, `roadmaps-client.tsx` — create/edit modal, list with progress API, owner menu, activate CTAs
- [x] `types/database.ts` — `Roadmap.user_id`, `UserRoadmap.is_active`

### Phase 2E — Visual Roadmap Workflow ✅ Complete

Canvas-style workflow nodes (roadmap.sh–style layout) with per-user completion; progress API prefers nodes when any exist; legacy `roadmap_skills` path unchanged when a roadmap has no nodes.

**Schema & RLS** (`supabase/migrations/005_roadmap_workflow_nodes.sql`):
- [x] `roadmap_nodes` — title, description, optional `skill_id`, `x`/`y`, FK to `roadmaps`
- [x] `user_roadmap_node_state` — `(user_id, node_id)` completion (shared definitions, per-user state)
- [x] RLS — nodes readable by all authenticated users; mutate nodes only if parent `roadmaps.user_id = auth.uid()`; state rows owner-only
- [x] `xp_logs.source_type` — extended with `'roadmap_node'`

**Progression & API:**
- [x] `awardRoadmapNodeCompletionXP` in `lib/progression.ts` — +10 XP, idempotent via `xp_logs`
- [x] `POST/PATCH/DELETE /api/roadmaps/[id]/nodes/...` — owner CRUD; `POST .../nodes/[nodeId]/complete` — any user toggles completion + optional XP

**Progress & dashboard:**
- [x] `GET /api/roadmaps/[id]/progress` — **graph** mode: `% = completed / total nodes`, `next_action` by `y` then `x`; **skills** mode unchanged when `nodes` empty
- [x] `components/dashboard/dashboard-client.tsx` — renders node cards when `mode === "graph"`

**UI:**
- [x] `app/(dashboard)/roadmaps/[id]/page.tsx` + `components/roadmaps/roadmap-workflow-canvas.tsx` — Framer Motion drag (owners), checkbox completion, add/edit/delete nodes
- [x] `roadmaps-client.tsx` — **Open** link to detail page; tertiary **glow** on active roadmap card; step count label in graph mode

### Phase 2D — Roadmap Graph System (Node Actions)

* [x] Double-click node edit (modal)
* [x] Node update (title, skills)
* [x] Node delete with cascade (edges, skills)
* [x] Skill linking (existing + create new)
* [x] Node completion toggle → XP distribution
* [x] Idempotent XP logic

**Files updated:**
* `supabase/migrations/006_roadmap_node_skills.sql` (schema update)
* `types/database.ts` (new types)
* `components/roadmaps/roadmap-workflow-canvas.tsx` (edit handlers, trigger modal)
* `components/roadmaps/roadmap-node-edit-modal.tsx` (new modal component)
* `app/api/roadmaps/[id]/nodes/[nodeId]/route.ts` (PATCH + custom skills, DELETE)
* `app/api/roadmaps/[id]/nodes/[nodeId]/complete/route.ts` (API to award XP)
* `lib/progression.ts` (distribution logic for XP to all node skills)

**Notes:**
* Connections are created via React Flow's `onConnect`, utilizing `Position.Top` and `Position.Bottom` handles for a vertical flow.
* Multiple connections per node supported. Duplicate edges and self-loop connections are prevented in the `onConnect` callback.
* Double click on any node opens the `RoadmapNodeEditModal` which allows assigning multiple skills (and creating custom ones inline).
* Checking off a node now distributes +10 XP across all linked skills uniformly, modeled after project completion logic.
* Deleting a node cascades and drops any incoming/outgoing edges via `ON DELETE CASCADE`.

### Phase 3 — Gamification & Polish
- [ ] Streak system (daily tracking, freeze feature)
- [ ] Achievement auto-unlock on milestones
- [ ] Level-up animations / notifications
- [ ] Achievement unlock toast notifications
- [ ] UI micro-interactions (hover scale 1.02x, press sink 0.98x)
- [ ] Richer “next step” heuristics (ordering, dependencies)

### Phase 4 — Advanced
- [ ] Full skill graph visualization (beyond roadmap workflow canvas)
- [ ] AI-powered roadmap recommendations (Claude API)
- [ ] Google Calendar integration for study sessions
- [ ] GitHub integration (auto-detect projects)
- [ ] Weekly progress reports
- [ ] PWA setup (mobile app experience)
- [ ] Open up signup (multi-user mode)

---

## Dashboard Data Status

| Feature                 | Status                                      |
| ----------------------- | ------------------------------------------- |
| Total XP                | ✅ Displayed in hero                        |
| Current level           | ✅ Displayed in hero                        |
| Progress to next level  | ✅ Progress bar in hero                     |
| Today's XP gained       | ✅ Displayed in hero subtitle               |
| Current streak          | ✅ In top bar + streak tracker card         |
| Longest streak          | ✅ Shown under current streak               |
| Last activity date      | ✅ "Last activity: X ago"                   |
| Active courses list     | ✅ Grid with gradient progress bars         |
| Course progress bars    | ✅ Gradient bars (green=done, blue=active)  |
| Roadmap from DB         | ✅ Fetches `user_roadmaps` (`is_active`)    |
| Roadmap % completion    | ✅ Graph: node completion; else skill levels |
| Recent activity feed    | ✅ Last 8 XP logs with icons + timestamps   |
| Next recommended action | ✅ Next incomplete node or next skill       |
| Lesson completion       | ✅ Click to complete + XP award             |
| Daily login XP          | ✅ Auto-award on dashboard load             |
| Project CRUD            | ✅ Create, edit, delete with skills         |
| Learning log submission | ✅ Batch progress log + +10 XP per entry    |
| Learning log display    | ✅ Per-course log list, collapse/expand     |
| Skill tag on log entry  | ✅ Multi-select + new skill creation        |
| Loading skeletons       | ❌ TODO (Phase 3 polish)                    |
| Level-up animations     | ❌ TODO (Phase 3)                           |

---

## Commit History

| Date       | Commit    | Description |
| ---------- | --------- | ----------- |
| 2025-01-26 | `118313a` | Initial WOYOhub setup — project scaffolding, database schema, auth, dashboard, courses, sidebar |
| 2025-01-26 | `6a72efc` | Fix: replace geist font with next/font/google |
| 2025-01-26 | `bdf129e` | Fix: add TypeScript types for cookiesToSet in middleware |
| 2025-01-26 | `ca69aa6` | Restrict access to allowed email only (email allowlist) |
| 2025-01-26 | `f7f116a` | Fix: wrap useSearchParams in Suspense boundary |
| 2025-01-26 | `cd60b93` | **Major UI redesign** — "Intellectual Ascent" design system. Complete rewrite of all 9 pages. |
| 2025-01-26 | `6addb8e` | Fix: TypeScript type for cookiesToSet in server.ts |
| 2025-01-26 | `078ebaf` | Fix: wrap login useSearchParams in Suspense + apply new design |
| 2025-01-26 | *Agent 2* | **Dashboard data integration** — real Supabase queries for today's XP, active roadmap, recent activity feed, streak tracker. CSS animations. Layout reorganization. |
| 2026-03-29 | *Agent 3* | **Phase 2B Core Logic** — Lesson completion + XP, project CRUD, roadmap % fix, daily login bonus, course detail page, progression library, RPC functions. |
| 2026-03-29 | `2c509a4` | **Fix Phase 2B build errors** — `total_xp` missing from profile SELECT; `Array.isArray` guard for Supabase skill join in roadmap progress route. |
| 2026-03-29 | `3c056c1` | **Phase 2C Learning Log System** — Migration 003, `POST /api/courses/[id]/log`, courses page rewrite with inline log form + collapsible log list. |
| 2026-03-29 | *Agent*   | **Phase 2D User roadmaps** — Migration 004 (`user_id`, `is_active`, RLS), roadmap CRUD + activate APIs, dashboard query + roadmaps list/modals. |
| 2026-03-29 | *Agent*   | **Phase 2E Visual workflow** — Migration 005 (`roadmap_nodes`, `user_roadmap_node_state`, `xp_logs`), node APIs + XP, dual progress mode, canvas page, dashboard + list UX. |

---

## Known Risks & Assumptions

1. **Streak visualization** — The 7-day calendar currently shows only the last activity day. For full streak history, query `xp_logs` grouped by day.
2. **Environment variables** — Build requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. **TypeScript strict mode** — Always type Supabase callback parameters explicitly (e.g., `cookiesToSet`). Always wrap `useSearchParams()` in `<Suspense>`.
4. **Migrations required** — Apply `001`–`005` in order in Supabase SQL Editor (including `002` for RPC functions, `004`/`005` for roadmaps).

---

## Database Schema

Core tables (evolving count) with Row Level Security:

```
profiles                  — User profiles (extends Supabase auth.users)
skills                    — Skill definitions (seeded defaults)
user_skills               — Per-user skill XP and levels
roadmaps                  — Career paths (templates: user_id NULL; user-owned: user_id set)
roadmap_skills            — Skills required per roadmap (+ required_level)
roadmap_nodes             — Workflow canvas nodes (title, skill link, x/y) — Phase 2E
user_roadmap_node_state     — Per-user node completion — Phase 2E
user_roadmaps             — User enrollments; is_active marks dashboard roadmap
courses                   — User's tracked courses
lessons                   — Individual lessons within courses
projects                  — User's project portfolio
project_skills            — Skills used per project
xp_logs                   — XP history (source_type includes roadmap_node)
achievements              — Achievement definitions
user_achievements         — Unlocked achievements per user
learning_logs             — Learning journal entries
learning_log_skills       — Skills tagged on a log entry (migration 003)
```

---

## Project Structure

```
woyohub/
├── app/
│   ├── (auth)/                 # Auth pages
│   │   ├── login/              # Email + Google OAuth (Suspense-wrapped)
│   │   ├── signup/             # Redirects to login
│   │   └── callback/           # OAuth callback with email allowlist
│   ├── (dashboard)/            # Main app (sidebar layout)
│   │   ├── dashboard/          # Level hero, roadmap, momentum, courses, activity, skills, achievements
│   │   ├── courses/            # Course library + add new course form
│   │   ├── skills/             # Skill tree grid
│   │   ├── roadmaps/           # Roadmap list + [id] workflow canvas
│   │   ├── projects/           # Project portfolio grid
│   │   ├── achievements/       # Unlocked vs locked achievements
│   │   ├── settings/           # Profile, appearance, integrations, danger zone
│   │   └── signout/            # Sign out confirmation
│   ├── globals.css             # CSS variables + animations (fade-in, pulse-glow)
│   ├── layout.tsx              # Root layout (Inter + Manrope fonts)
│   └── page.tsx                # Landing page
├── components/
│   ├── dashboard/
│   │   └── dashboard-client.tsx  # Interactive dashboard with real Supabase data
│   ├── roadmaps/                 # Roadmap form modal, list client, workflow canvas
│   ├── layout/
│   │   ├── sidebar.tsx           # Responsive sidebar (6 main + 2 bottom nav)
│   │   └── top-bar.tsx           # Glassmorphic top bar
│   └── ui/
│       ├── grad-bar.tsx          # Gradient progress bar component
│       └── theme-provider.tsx    # Dark mode context + toggle
├── lib/
│   ├── supabase/               # Client, server, middleware helpers
│   └── utils/                  # cn(), formatDate, formatRelativeTime, getProgressPercentage
├── types/                      # TypeScript types + XP constants + level formulas
├── supabase/migrations/        # 001–005 SQL migrations
├── DESIGN.md                   # Design system specification
├── DEVLOG.md                   # This file
└── middleware.ts                # Auth + access control middleware
```

---

## Access Control

Single-user mode. Restricted at two layers:

1. **OAuth callback** (`app/(auth)/callback/route.ts`) — checks email after Google sign-in
2. **Middleware** (`lib/supabase/middleware.ts`) — checks email on every protected route

Allowed: `aungkomyat.lucas@gmail.com`. Update `ALLOWED_EMAILS` in both files to add users.

---

## Local Development

```bash
git clone https://github.com/Lucas-DevOps17/woyohub.git
cd woyohub
cp .env.local.example .env.local   # Add Supabase credentials
npm install
npm run dev                         # http://localhost:3000
```

Apply `supabase/migrations/` in numeric order (`001` through `005` as needed) in the Supabase SQL Editor before using roadmaps v2 and workflow features.

---

## Multi-Agent Development

This project is developed by multiple AI agents in parallel conversations. Each documents their work here so the next agent or human can pick up seamlessly.

| Agent   | Scope |
| ------- | ----- |
| Agent 1 | Architecture, scaffolding, auth, UI design (v1→v4 iterations), all page implementations, deployment pipeline, DEVLOG |
| Agent 2 | Dashboard data integration: real-time Supabase queries (today's XP, streaks, roadmaps, activity feed), CSS animations, dashboard layout reorganization |

---

## Next Recommended Steps (Phase 3 — Gamification & Polish)

1. **Loading skeletons** — Skeleton components for all dashboard cards during data fetch
2. **Level-up animations** — Modal/toast when user levels up
3. **Achievement auto-unlock** — Check milestones on XP gain, unlock achievements with toast
4. **Streak freeze feature** — Allow users to freeze streak once per month
5. **Daily reflection persistence** — Save journal entries to `learning_logs` table
6. **Course CRUD** — Edit/delete courses, bulk add lessons
7. **UI micro-interactions** — Hover scale 1.02x, press sink 0.98x

---

## Notes for Contributors

- **Design system** — Follow `DESIGN.md`. No borders, no pure-black shadows, no generic fonts.
- **Mobile-first** — Test at 375px width minimum.
- **TypeScript strict** — Always type Supabase callback params. Wrap `useSearchParams()` in `<Suspense>`.
- **Dark mode** — Uses `.dark` class + CSS custom properties. Test both modes.
- **RLS** — The anon key is public by design. Row Level Security policies protect all data.
- When adding tables, always add RLS policies and update `types/database.ts`.
