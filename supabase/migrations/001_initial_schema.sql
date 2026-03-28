-- ============================================
-- WOYOhub Database Schema
-- Migration: 001_initial_schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. User Profiles (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_count INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Skills
-- ============================================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. User Skills (progress per skill)
-- ============================================
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- ============================================
-- 4. Roadmaps
-- ============================================
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. Roadmap Skills (which skills a roadmap requires)
-- ============================================
CREATE TABLE public.roadmap_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(roadmap_id, skill_id)
);

-- ============================================
-- 6. User Roadmaps (which roadmaps a user is following)
-- ============================================
CREATE TABLE public.user_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, roadmap_id)
);

-- ============================================
-- 7. Courses
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Other',
  url TEXT,
  total_units INTEGER NOT NULL DEFAULT 1,
  completed_units INTEGER NOT NULL DEFAULT 0,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'dropped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. Lessons (optional granularity within courses)
-- ============================================
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

-- ============================================
-- 9. Projects
-- ============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed')),
  github_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. Project Skills (which skills a project uses)
-- ============================================
CREATE TABLE public.project_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE(project_id, skill_id)
);

-- ============================================
-- 11. XP Logs
-- ============================================
CREATE TABLE public.xp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('lesson', 'course', 'project', 'daily_login', 'achievement')),
  source_id UUID,
  amount INTEGER NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. Achievements
-- ============================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('courses', 'projects', 'streaks', 'xp', 'skills')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. User Achievements
-- ============================================
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 14. Learning Logs (daily journal)
-- ============================================
CREATE TABLE public.learning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX idx_courses_user ON public.courses(user_id);
CREATE INDEX idx_courses_status ON public.courses(user_id, status);
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_xp_logs_user ON public.xp_logs(user_id);
CREATE INDEX idx_xp_logs_created ON public.xp_logs(user_id, created_at);
CREATE INDEX idx_lessons_course ON public.lessons(course_id);
CREATE INDEX idx_learning_logs_user ON public.learning_logs(user_id);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Skills (read-only for all authenticated users)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by authenticated users" ON public.skills FOR SELECT TO authenticated USING (true);

-- User Skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);

-- Roadmaps (read-only for all)
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roadmaps are viewable by authenticated users" ON public.roadmaps FOR SELECT TO authenticated USING (true);

-- Roadmap Skills (read-only)
ALTER TABLE public.roadmap_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roadmap skills are viewable" ON public.roadmap_skills FOR SELECT TO authenticated USING (true);

-- User Roadmaps
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roadmaps" ON public.user_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmaps" ON public.user_roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.user_roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.user_roadmaps FOR DELETE USING (auth.uid() = user_id);

-- Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own courses" ON public.courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = user_id);

-- Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view lessons of own courses" ON public.lessons FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.user_id = auth.uid()));
CREATE POLICY "Users can insert lessons to own courses" ON public.lessons FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.user_id = auth.uid()));
CREATE POLICY "Users can update lessons of own courses" ON public.lessons FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.user_id = auth.uid()));
CREATE POLICY "Users can delete lessons of own courses" ON public.lessons FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.user_id = auth.uid()));

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Project Skills
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view skills of own projects" ON public.project_skills FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_skills.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert skills to own projects" ON public.project_skills FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_skills.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete skills from own projects" ON public.project_skills FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_skills.project_id AND projects.user_id = auth.uid()));

-- XP Logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp logs" ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp logs" ON public.xp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements (read-only for all)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by authenticated users" ON public.achievements FOR SELECT TO authenticated USING (true);

-- User Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning Logs
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own learning logs" ON public.learning_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning logs" ON public.learning_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning logs" ON public.learning_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning logs" ON public.learning_logs FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on signup (trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_courses BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_user_skills BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Seed: Default Achievements
-- ============================================
INSERT INTO public.achievements (title, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
  ('First steps', 'Complete your first lesson', '🎯', 'courses', 'lessons_completed', 1, 10),
  ('Course champion', 'Complete your first course', '📚', 'courses', 'courses_completed', 1, 50),
  ('Knowledge seeker', 'Complete 5 courses', '🧠', 'courses', 'courses_completed', 5, 100),
  ('Builder', 'Complete your first project', '🔨', 'projects', 'projects_completed', 1, 50),
  ('Portfolio pro', 'Complete 5 projects', '💼', 'projects', 'projects_completed', 5, 100),
  ('On fire', 'Reach a 7-day streak', '🔥', 'streaks', 'streak_days', 7, 50),
  ('Unstoppable', 'Reach a 30-day streak', '⚡', 'streaks', 'streak_days', 30, 200),
  ('Century', 'Earn 100 XP', '💯', 'xp', 'total_xp', 100, 10),
  ('Thousand club', 'Earn 1000 XP', '🏅', 'xp', 'total_xp', 1000, 50),
  ('Legend', 'Earn 10000 XP', '👑', 'xp', 'total_xp', 10000, 200),
  ('Skill starter', 'Level up your first skill', '⭐', 'skills', 'skills_leveled', 1, 25),
  ('Multi-talented', 'Level up 5 different skills', '🌟', 'skills', 'skills_leveled', 5, 100);

-- ============================================
-- Seed: Default Skills
-- ============================================
INSERT INTO public.skills (name, category, icon, description) VALUES
  ('HTML', 'Frontend', '🌐', 'Structure and content of web pages'),
  ('CSS', 'Frontend', '🎨', 'Styling and layout of web pages'),
  ('JavaScript', 'Frontend', '⚡', 'Programming language for the web'),
  ('TypeScript', 'Frontend', '🔷', 'Typed superset of JavaScript'),
  ('React', 'Frontend', '⚛️', 'Component-based UI library'),
  ('Next.js', 'Frontend', '▲', 'React framework for production'),
  ('Node.js', 'Backend', '🟢', 'JavaScript runtime for servers'),
  ('Python', 'Backend', '🐍', 'General purpose programming language'),
  ('SQL', 'Backend', '🗄️', 'Database query language'),
  ('Git', 'DevOps', '📦', 'Version control system'),
  ('Docker', 'DevOps', '🐳', 'Containerization platform'),
  ('Machine Learning', 'AI/ML', '🤖', 'Building intelligent systems'),
  ('Data Science', 'AI/ML', '📊', 'Extracting insights from data'),
  ('UI/UX Design', 'Design', '✏️', 'User interface and experience design'),
  ('System Design', 'Architecture', '🏗️', 'Designing scalable systems');

-- ============================================
-- Seed: Default Roadmaps
-- ============================================
INSERT INTO public.roadmaps (title, description, icon, difficulty, estimated_hours) VALUES
  ('Frontend developer', 'Master modern frontend technologies from HTML to React', '🌐', 'beginner', 200),
  ('Full-stack developer', 'Build complete web applications end to end', '🚀', 'intermediate', 400),
  ('AI/ML engineer', 'Learn machine learning from foundations to deployment', '🤖', 'advanced', 500),
  ('DevOps engineer', 'Master deployment, containerization, and infrastructure', '⚙️', 'intermediate', 300);
