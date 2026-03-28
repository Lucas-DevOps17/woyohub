# WOYOhub

**Your learning journey, gamified.** Track courses, build projects, follow career roadmaps, and level up with XP, streaks, and achievements.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment:** Vercel
- **State:** TanStack Query + Zustand

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `woyohub`, pick your region
3. Save your database password

### 2. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. This creates all tables, RLS policies, triggers, and seed data

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

### 6. Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

## Project Structure

```
woyohub/
├── app/
│   ├── (auth)/          # Login, signup, OAuth callback
│   ├── (dashboard)/     # Main app pages (sidebar layout)
│   │   ├── dashboard/   # Home dashboard
│   │   ├── courses/     # Course tracking
│   │   ├── skills/      # Skill progression
│   │   ├── roadmaps/    # Career roadmaps
│   │   ├── projects/    # Project portfolio
│   │   ├── achievements/# Badges & achievements
│   │   └── settings/    # User settings
│   ├── globals.css
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Sidebar, header
│   ├── dashboard/       # Dashboard widgets
│   ├── courses/         # Course components
│   ├── projects/        # Project components
│   └── gamification/    # XP, streaks, badges
├── lib/
│   ├── supabase/        # Client, server, middleware
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   └── utils/           # Helper functions
├── types/               # TypeScript types
├── supabase/
│   └── migrations/      # SQL migration files
└── public/              # Static assets
```

## Build Phases

- **Phase 1 (MVP):** ✅ Auth, Courses, Dashboard, XP
- **Phase 2:** Skills, Roadmaps, Projects
- **Phase 3:** Gamification (badges, streaks), UI polish
- **Phase 4:** Skill graph, AI recommendations, PWA

## License

Private project.
