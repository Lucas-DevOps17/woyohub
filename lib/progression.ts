import { SupabaseClient } from "@supabase/supabase-js";
import { getTodayDateKey } from "@/lib/utils";

export const XP_REWARDS = {
  LESSON_COMPLETE: 10,
  COURSE_COMPLETE: 50,
  PROJECT_COMPLETE: 100,
  DAILY_LOGIN: 5,
  ROADMAP_NODE_COMPLETE: 10,
} as const;

export const calculateSkillLevel = (xp: number): number => {
  return Math.floor(xp / 100);
};

type ProgressionResult = {
  success: boolean;
  error?: string;
  xpAwarded?: number;
  isStreakDay?: boolean;
};

type RpcResponse = {
  success?: boolean;
  error?: string | null;
  xpAwarded?: number;
  xp_awarded?: number;
  isStreakDay?: boolean;
  is_streak_day?: boolean;
};

function normalizeRpcResult(payload: RpcResponse | null, fallbackError: string): ProgressionResult {
  if (!payload) {
    return { success: false, error: fallbackError };
  }

  return {
    success: payload.success !== false,
    error: payload.error ?? undefined,
    xpAwarded: payload.xpAwarded ?? payload.xp_awarded,
    isStreakDay: payload.isStreakDay ?? payload.is_streak_day,
  };
}

export async function awardLessonXP(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  courseId: string
): Promise<ProgressionResult> {
  const { data, error } = await supabase.rpc("award_lesson_xp_atomic", {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_course_id: courseId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return normalizeRpcResult(data as RpcResponse | null, "Lesson award failed");
}

export async function awardCourseXP(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  skillId: string | null
): Promise<ProgressionResult> {
  const { data, error } = await supabase.rpc("award_course_xp_atomic", {
    p_user_id: userId,
    p_course_id: courseId,
    p_skill_id: skillId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return normalizeRpcResult(data as RpcResponse | null, "Course award failed");
}

export async function awardProjectXP(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<ProgressionResult> {
  const { data, error } = await supabase.rpc("award_project_xp_atomic", {
    p_user_id: userId,
    p_project_id: projectId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return normalizeRpcResult(data as RpcResponse | null, "Project award failed");
}

export async function awardDailyLoginXP(
  supabase: SupabaseClient,
  userId: string
): Promise<ProgressionResult> {
  const { data, error } = await supabase.rpc("award_daily_login_xp_atomic", {
    p_user_id: userId,
    p_today: getTodayDateKey(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return normalizeRpcResult(data as RpcResponse | null, "Daily login award failed");
}

export async function awardRoadmapNodeCompletionXP(
  supabase: SupabaseClient,
  userId: string,
  nodeId: string
): Promise<ProgressionResult> {
  const { data, error } = await supabase.rpc("award_roadmap_node_xp_atomic", {
    p_user_id: userId,
    p_node_id: nodeId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return normalizeRpcResult(data as RpcResponse | null, "Roadmap node award failed");
}

export async function setRoadmapNodeCompletionState(
  supabase: SupabaseClient,
  userId: string,
  nodeId: string,
  completed: boolean
): Promise<ProgressionResult> {
  const { data, error } = await supabase.rpc("set_roadmap_node_completion_atomic", {
    p_user_id: userId,
    p_node_id: nodeId,
    p_completed: completed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return normalizeRpcResult(data as RpcResponse | null, "Roadmap completion update failed");
}
