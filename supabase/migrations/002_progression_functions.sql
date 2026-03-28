-- ============================================
-- WOYOhub Database Schema
-- Migration: 002_progression_functions
-- Description: RPC functions for XP progression
-- ============================================

-- ============================================
-- RPC: Increment user XP (atomic operation)
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER
) RETURNS VOID AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current total and calculate new values
  SELECT total_xp + p_xp_amount INTO new_total_xp
  FROM public.profiles
  WHERE id = p_user_id;

  new_level := FLOOR(new_total_xp / 100);

  -- Update profile
  UPDATE public.profiles
  SET
    total_xp = new_total_xp,
    level = new_level,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_user_xp(UUID, INTEGER) TO authenticated;

-- ============================================
-- RPC: Get roadmap progress
-- ============================================
CREATE OR REPLACE FUNCTION public.get_roadmap_progress(
  p_roadmap_id UUID,
  p_user_id UUID
) RETURNS TABLE (
  skill_id UUID,
  skill_name TEXT,
  skill_icon TEXT,
  required_level INTEGER,
  user_level INTEGER,
  user_xp INTEGER,
  progress_percent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.skill_id,
    s.name AS skill_name,
    s.icon AS skill_icon,
    rs.required_level,
    COALESCE(us.level, 0) AS user_level,
    COALESCE(us.xp, 0) AS user_xp,
    CASE
      WHEN rs.required_level = 0 THEN 100
      ELSE LEAST(FLOOR((COALESCE(us.level, 0)::FLOAT / rs.required_level::FLOAT) * 100), 100)::INTEGER
    END AS progress_percent
  FROM public.roadmap_skills rs
  JOIN public.skills s ON s.id = rs.skill_id
  LEFT JOIN public.user_skills us ON us.skill_id = rs.skill_id AND us.user_id = p_user_id
  WHERE rs.roadmap_id = p_roadmap_id
  ORDER BY rs.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_roadmap_progress(UUID, UUID) TO authenticated;
