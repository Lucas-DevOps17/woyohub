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

### Phase 3 — Gamification & Polish
- [ ] Streak system (daily tracking, freeze feature)
- [ ] Achievement auto-unlock on milestones
- [ ] Level-up animations / notifications
- [ ] Achievement unlock toast notifications
- [ ] UI micro-interactions (hover scale 1.02x, press sink 0.98x)
- [ ] Next recommended action (needs `roadmap_skills` join)

### Phase 4 — Advanced
- [ ] Skill graph visualization (interactive node tree)
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
| Roadmap from DB         | ✅ Fetches `user_roadmaps`                  |
| Roadmap % completion    | ✅ Real skill-based calculation             |
| Recent activity feed    | ✅ Last 8 XP logs with icons + timestamps   |
| Next recommended action | ✅ Shows next skill to level up             |
| Lesson completion       | ✅ Click to complete + XP award             |
| Daily login XP          | ✅ Auto-award on dashboard load             |
| Project CRUD            | ✅ Create, edit, delete with skills         |
| Loading skeletons       | ❌ TODO (Phase 2B polish)                   |
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

---

## Known Risks & Assumptions

1. **Streak visualization** — The 7-day calendar currently shows only the last activity day. For full streak history, query `xp_logs` grouped by day.
2. **Environment variables** — Build requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. **TypeScript strict mode** — Always type Supabase callback parameters explicitly (e.g., `cookiesToSet`). Always wrap `useSearchParams()` in `<Suspense>`.
4. **Migration required** — Run `supabase/migrations/002_progression_functions.sql` in Supabase SQL Editor for RPC functions.

---

## Database Schema

14 tables with full Row Level Security:

```
profiles          — User profiles (extends Supabase auth.users)
skills            — Skill definitions (seeded with 15 defaults)
user_skills       — Per-user skill XP and levels
roadmaps          — Career path definitions (seeded with 4 defaults)
roadmap_skills    — Skills required per roadmap
user_roadmaps     — User's active roadmaps
courses           — User's tracked courses
lessons           — Individual lessons within courses
projects          — User's project portfolio
project_skills    — Skills used per project
xp_logs           — XP transaction history
achievements      — Achievement definitions (seeded with 12 defaults)
user_achievements — Unlocked achievements per user
learning_logs     — Daily learning journal entries
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
│   │   ├── roadmaps/           # Career roadmap cards
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
├── supabase/migrations/        # SQL schema file
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

Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor before first use.

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
