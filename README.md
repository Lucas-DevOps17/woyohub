# WOYOhub

**Your learning journey, gamified.** Track courses, build projects, follow career roadmaps, and level up with XP, streaks, and achievements.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + React Flow
- **Backend:** Supabase (PostgreSQL, Auth, RLS Policies)
- **Deployment:** Vercel (CI/CD)
- **Design:** "Intellectual Ascent" System (Manrope + Inter, soft gradients, no borders)

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `woyohub`, pick your region
3. Save your database password

### 2. Run the Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Apply the migration files from `supabase/migrations/` in numerical order (001 through 006).
3. This creates all tables, RLS policies, trigger functions, the XP RPC calculations, and seed data.

### 3. Enable Google OAuth (Optional)

1. In Supabase dashboard → Authentication → Providers
2. Enable Google
3. Add your Google OAuth credentials
4. Set redirect URL to `http://localhost:3000/callback`

### 4. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL and keys from **Settings → API**.

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```text
woyohub/
├── app/
│   ├── (auth)/          # Auth flows & OAuth callbacks with Email Allowlisting
│   ├── (dashboard)/     # Main app routes
│   │   ├── dashboard/   # XP hero, active roadmap fetch, recent logs
│   │   ├── courses/     # Interactive course library and Learning Log integration
│   │   ├── skills/      # Skill tree grid with XP calculations
│   │   ├── roadmaps/    # Custom visual roadmaps leveraging React Flow Canvas
│   │   ├── projects/    # Project portfolio tied to skill upgrades
│   │   ├── achievements/# Gamification badges
│   │   └── settings/    # Profile + appearance + Danger zone
│   ├── api/             # App Router Endpoints for Roadmap nodes, edges, logs, XP logic
│   ├── globals.css      # Core tailwind setup + dark mode classes
│   └── layout.tsx       # Root layout defining dynamic Dual Typography (Manrope/Inter)
├── components/
│   ├── dashboard/       # Client-side interaction components
│   ├── layout/          # Sidebar / Glassmorphic top bar / UI shells
│   ├── roadmaps/        # Workflow Canvas components, ReactFlow logic, and Modals
│   └── ui/              # Shared elements
├── lib/
│   ├── progression.ts   # Core XP engine to distribute, scale, and calculate skills
│   └── supabase/        # Next.js 14 advanced SSR clients via @supabase/ssr
├── supabase/
│   └── migrations/      # 001-006 containing advanced Row Level Security and RPCs
└── types/               # TypeScript Definitions matching DB types
```

## Build Phases & Scope

- **Phase 1 (MVP):** ✅ Complete (Project scaffolding, Schema, Access Control, 9-page Layout Rewrite, UI foundations)
- **Phase 2 (Data Integration & Workflow):** ✅ Complete (Real-time DB hooks, API implementations, Learning Logs Engine, Project CRUD, Visual Workflow Canvas for Node-based Roadmaps, Ambiguity Bugfixes)
- **Phase 3 (Gamification & Polish):** ⏳ In Progress (Streaks, Badges, Level-up animations, UI micro-interactions, Loading Skeletons)
- **Phase 4 (Advanced):** ⏳ Upcoming (Skill graphs, AI roadmap generation, GitHub/Calendar integratons)

See `DEVLOG.md` for full implementation and phase specifics.

## License

Private project.
