// ============================================
// WOYOhub Database Types
// ============================================

export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freeze_count: number;
  created_at: string;
  updated_at: string;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  description: string | null;
  created_at: string;
};

export type UserSkill = {
  id: string;
  user_id: string;
  skill_id: string;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
  // Joined
  skill?: Skill;
};

export type Roadmap = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_hours: number | null;
  created_at: string;
  /** null = template/seed; set for user-created roadmaps */
  user_id: string | null;
};

export type RoadmapSkill = {
  id: string;
  roadmap_id: string;
  skill_id: string;
  required_level: number;
  order_index: number;
  // Joined
  skill?: Skill;
};

export type RoadmapNode = {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  skill_id: string | null;
  x: number;
  y: number;
  created_at: string;
  skill?: Pick<Skill, "name" | "icon"> | null;
};

export type UserRoadmapNodeState = {
  user_id: string;
  node_id: string;
  completed: boolean;
  completed_at: string | null;
};

export type UserRoadmap = {
  id: string;
  user_id: string;
  roadmap_id: string;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  // Joined
  roadmap?: Roadmap;
};

export type Course = {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  url: string | null;
  total_units: number;
  completed_units: number;
  skill_id: string | null;
  notes: string | null;
  status: "active" | "completed" | "paused" | "dropped";
  created_at: string;
  updated_at: string;
  // Joined
  skill?: Skill;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  order_index: number;
  notes: string | null;
};

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "planned" | "in-progress" | "completed";
  github_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectSkill = {
  id: string;
  project_id: string;
  skill_id: string;
  // Joined
  skill?: Skill;
};

export type XpLog = {
  id: string;
  user_id: string;
  source_type: "lesson" | "course" | "project" | "daily_login" | "achievement" | "roadmap_node";
  source_id: string | null;
  amount: number;
  skill_id: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "courses" | "projects" | "streaks" | "xp" | "skills";
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  // Joined
  achievement?: Achievement;
};

export type LearningLog = {
  id: string;
  user_id: string;
  content: string;
  course_id: string | null;
  created_at: string;
};

// ============================================
// Helper types
// ============================================

export type Platform =
  | "Coursera"
  | "YouTube"
  | "Udemy"
  | "freeCodeCamp"
  | "Codecademy"
  | "Pluralsight"
  | "LinkedIn Learning"
  | "edX"
  | "Khan Academy"
  | "Other";

export type DashboardStats = {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  activeCourses: number;
  completedCourses: number;
  completedProjects: number;
  todayXp: number;
  achievements: number;
};

// XP constants
export const XP_REWARDS = {
  LESSON_COMPLETE: 10,
  COURSE_COMPLETE: 50,
  PROJECT_COMPLETE: 100,
  DAILY_LOGIN: 5,
  ROADMAP_NODE_COMPLETE: 10,
} as const;

// Level formula
export const calculateLevel = (totalXp: number): number => {
  return Math.floor(totalXp / 100);
};

export const xpForNextLevel = (currentLevel: number): number => {
  return (currentLevel + 1) * 100;
};

export const xpProgressInLevel = (totalXp: number): number => {
  return totalXp % 100;
};
