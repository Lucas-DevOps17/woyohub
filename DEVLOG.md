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

- **No borders** — surfaces are defined by tonal background shifts (`#faf8ff` → `#f3f2ff` → `#ffffff`)
- **Dual typeface** — Manrope (display/headlines, bold + geometric) + Inter (body/utility, highly legible)
- **Gradient progress bars** — tertiary green-to-mint (`#006631` → `#62ff96`) for completion, primary blue for in-progress
- **Ambient tinted shadows** — `rgba(0,73,219,0.06)`, never pure black
- **Pill buttons** — `border-radius: 9999px` with gradient fills
- **Card radius** — `24px` (3xl) with no visible borders
- **Dark mode** — full theme support via CSS custom properties and `.dark` class
- **Glassmorphic top bar** — `backdrop-filter: blur(16px)` with semi-transparent background
- **Level hero card** — dark gradient with decorative circles and blue XP progress bar
- **"Start Learning" FAB** — floating action button with gradient and shadow

---

## Build Phases

### Phase 1 — MVP ← *current*
- [x] Project scaffolding (Next.js + Tailwind + TypeScript)
- [x] Supabase integration (client, server, middleware)
- [x] Database schema (14 tables, RLS policies, triggers, seed data)
- [x] Auth system (Google OAuth + email/password)
- [x] Access control (email allowlist — single-user mode)
- [x] Landing page (Intellectual Ascent design)
- [x] **Dashboard** — Level hero, roadmap progress, daily momentum with streak tracker, active courses with progress, skill tree sidebar, achievements sidebar, "Start Learning" FAB
- [x] **Courses page** — Full course library with dark card headers, platform tags, progress bars, add course form
- [x] **Skills page** — Grid of all skills with icons, mastery levels, XP scores, progress bars
- [x] **Roadmaps page** — Career path cards with difficulty badges, progress indicators, Start/Continue buttons
- [x] **Projects page** — Portfolio grid with status badges, skill tags, dark image headers
- [x] **Achievements page** — Unlocked vs locked grid with grayscale + dashed border for locked
- [x] **Settings page** — Profile editing, dark mode toggle, Google Calendar + GitHub integration placeholders, danger zone
- [x] **Sign out page** — Confirmation screen with streak reminder
- [x] Responsive sidebar navigation (mobile slide-out drawer)
- [x] Glassmorphic top bar (search, streak badge, level badge, avatar)
- [x] Dark mode toggle (persisted to localStorage)
- [x] Vercel deployment with CI/CD
- [ ] Mark lesson complete (with XP award)
- [ ] Course detail page (edit, delete, lesson list)
- [ ] Daily login XP bonus + streak update logic
- [ ] Daily reflection save to database

### Phase 2 — Data Flow & Interactivity
- [ ] Mark lesson complete → XP award → skill XP → level calculation
- [ ] Start/continue roadmap functionality
- [ ] Project CRUD (create, edit, delete with skill tags)
- [ ] Streak logic (daily tracking, freeze feature)
- [ ] Achievement auto-unlock on milestones
- [ ] Daily reflection persistence (learning_logs table)
- [ ] Course detail/edit page

### Phase 3 — Gamification & Polish
- [ ] XP log history view
- [ ] Level-up animations / notifications
- [ ] Achievement unlock toast notifications
- [ ] Streak freeze feature
- [ ] UI micro-interactions (hover scale, press sink)
- [ ] Loading states and skeleton screens

### Phase 4 — Advanced
- [ ] Skill graph visualization (interactive node tree)
- [ ] AI-powered roadmap recommendations (Claude API)
- [ ] Google Calendar integration for study sessions
- [ ] GitHub integration (auto-detect projects)
- [ ] Weekly progress reports
- [ ] PWA setup (mobile app experience)
- [ ] Open up signup (multi-user mode)

---

## Commit History

| Date       | Commit    | Description |
| ---------- | --------- | ----------- |
| 2025-01-26 | `118313a` | Initial WOYOhub setup — full project scaffolding, database schema, auth, dashboard, courses, sidebar |
| 2025-01-26 | `6a72efc` | Fix: replace geist font with next/font/google (Inter + JetBrains Mono) |
| 2025-01-26 | `bdf129e` | Fix: add TypeScript types for cookiesToSet in Supabase middleware |
| 2025-01-26 | `ca69aa6` | Restrict access to allowed email only (Google OAuth + email allowlist) |
| 2025-01-26 | `f7f116a` | Fix: wrap useSearchParams in Suspense boundary for Next.js 14 |
| 2025-01-26 | *pending* | **Major UI redesign** — "Intellectual Ascent" design system. Complete rewrite of all pages. Manrope + Inter typography, tonal surfaces, no borders, gradient progress bars, dark mode, glassmorphic top bar, level hero card, FAB. Added Settings page, Sign Out page. 7 fully designed pages. |
| 2026-03-29 | *pending* | **Dashboard Phase 2A: Data Integration** — Connected dashboard to real data: today's XP from xp_logs, active roadmap from user_roadmaps, recent activity feed (last 10 XP logs). Added Streak Tracker card with current/longest streak and last activity date. Added Recent Activity sidebar. Added CSS animations (fade-in, pulse-glow). Layout reorganized for at-a-glance progress visibility. |

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
│   │   ├── login/              # Email + Google OAuth login
│   │   ├── signup/             # Redirects to login
│   │   └── callback/           # OAuth callback with email allowlist
│   ├── (dashboard)/            # Main app (sidebar layout)
│   │   ├── dashboard/          # Level hero, roadmap, momentum, courses, skills, achievements
│   │   ├── courses/            # Course library + add new course form
│   │   ├── skills/             # Skill tree grid
│   │   ├── roadmaps/           # Career roadmap cards
│   │   ├── projects/           # Project portfolio grid
│   │   ├── achievements/       # Unlocked vs locked achievements
│   │   ├── settings/           # Profile, appearance, integrations, danger zone
│   │   └── signout/            # Sign out confirmation
│   ├── globals.css             # Design system CSS variables + Tailwind
│   ├── layout.tsx              # Root layout (Inter + Manrope fonts)
│   └── page.tsx                # Landing page
├── components/
│   ├── dashboard/
│   │   └── dashboard-client.tsx  # Interactive dashboard widgets
│   ├── layout/
│   │   ├── sidebar.tsx           # Responsive sidebar with all nav items
│   │   └── top-bar.tsx           # Glassmorphic top bar
│   └── ui/
│       ├── grad-bar.tsx          # Gradient progress bar component
│       └── theme-provider.tsx    # Dark mode context + toggle
├── lib/
│   ├── supabase/               # Client, server, middleware helpers
│   └── utils/                  # cn(), formatDate, progress helpers
├── types/                      # TypeScript types + XP constants
├── supabase/migrations/        # SQL schema file
├── DESIGN.md                   # Design system specification
├── DEVLOG.md                   # This file
└── middleware.ts                # Auth + access control middleware
```

---

## Access Control

Currently running in **single-user mode**. Access is restricted at two layers:

1. **OAuth callback** (`app/(auth)/callback/route.ts`) — checks email after Google sign-in
2. **Middleware** (`lib/supabase/middleware.ts`) — checks email on every protected route

Allowed email: `aungkomyat.lucas@gmail.com`

To add more users, update the `ALLOWED_EMAILS` array in both files.

---

## Local Development

```bash
git clone https://github.com/Lucas-DevOps17/woyohub.git
cd woyohub
cp .env.local.example .env.local   # Add your Supabase credentials
npm install
npm run dev                         # http://localhost:3000
```

Run the SQL migration (`supabase/migrations/001_initial_schema.sql`) in your Supabase SQL Editor before first use.

---

## Notes for Contributors

- **Design system** — Follow `DESIGN.md` strictly. No borders, no pure-black shadows, no generic fonts. Use CSS custom properties for all colors.
- **AI-assisted development** — This project is built iteratively with Claude (Anthropic). Each phase is planned in conversation.
- **Mobile-first** — All UI must be responsive. Single-column on mobile, multi-column on desktop. Test at 375px.
- **No over-engineering** — Follow the phase plan. Don't build gamification logic before course tracking works perfectly.
- **RLS is the security layer** — The anon key is public by design. Row Level Security policies protect all data.
- When adding new tables, always add RLS policies and update `types/database.ts`.
- Dark mode uses `.dark` class on `<html>` and CSS custom properties. Test both modes.
