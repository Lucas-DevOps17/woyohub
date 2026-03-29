import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkAndUnlockAchievements } from "@/lib/achievements";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json();
    const {
      units_completed,
      summary,
      skill_ids = [],
      new_skill_name,
      new_skill_icon,
    } = json;

    const { data: existingLog, error: existingLogError } = await supabase
      .from("learning_logs")
      .select("id, course_id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (existingLogError || !existingLog) throw existingLogError ?? new Error("Log not found");

    const { data: log, error } = await supabase
      .from("learning_logs")
      .update({
        units_completed,
        content: summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    // Handle skills (delete existing, insert new ones)
    if (Array.isArray(skill_ids) || typeof new_skill_name === "string") {
      const { error: deleteLinksError } = await supabase
        .from("learning_log_skills")
        .delete()
        .eq("learning_log_id", params.id);

      if (deleteLinksError) throw deleteLinksError;

      const resolvedSkillIds = new Set<string>();

      if (Array.isArray(skill_ids) && skill_ids.length > 0) {
        const safeSkillIds = skill_ids.filter(
          (skillId: unknown): skillId is string => typeof skillId === "string" && skillId.length > 0
        );

        if (safeSkillIds.length > 0) {
          const { data: ownedSkills } = await supabase
            .from("skills")
            .select("id")
            .eq("user_id", user.id)
            .in("id", safeSkillIds);

          (ownedSkills || []).forEach((skill) => resolvedSkillIds.add(skill.id));
        }
      }

      if (typeof new_skill_name === "string" && new_skill_name.trim()) {
        const { data: createdSkill, error: skillCreateError } = await supabase
          .from("skills")
          .insert({
            user_id: user.id,
            name: new_skill_name.trim(),
            icon: typeof new_skill_icon === "string" ? new_skill_icon.trim() || null : null,
            category: "custom",
          })
          .select("id")
          .single();

        if (skillCreateError) throw skillCreateError;
        if (createdSkill?.id) resolvedSkillIds.add(createdSkill.id);
      }

      if (resolvedSkillIds.size > 0) {
        const { error: insertLinksError } = await supabase.from("learning_log_skills").insert(
          Array.from(resolvedSkillIds).map((sid) => ({
            learning_log_id: params.id,
            skill_id: sid,
          }))
        );

        if (insertLinksError) throw insertLinksError;
      }
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id, total_units")
      .eq("id", existingLog.course_id)
      .eq("user_id", user.id)
      .single();

    if (course) {
      const { data: allLogs } = await supabase
        .from("learning_logs")
        .select("units_completed")
        .eq("course_id", existingLog.course_id)
        .eq("user_id", user.id);

      const completedUnits = Math.min(
        course.total_units || 1,
        (allLogs || []).reduce((sum, entry) => sum + (entry.units_completed || 0), 0)
      );

      await supabase
        .from("courses")
        .update({
          completed_units: completedUnits,
          status: completedUnits >= (course.total_units || 1) ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLog.course_id)
        .eq("user_id", user.id);
    }

    // Call recompute
    await supabase.rpc("recompute_user_xp", { p_user_id: user.id });

    // Check milestones just in case
    const unlockRes = await checkAndUnlockAchievements(supabase, user.id);

    return NextResponse.json({ success: true, log, unlockedAchievements: unlockRes.newUnlocks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: existingLog } = await supabase
      .from("learning_logs")
      .select("course_id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("learning_logs")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;

    // Recalculate XP
    const { error: rpcError } = await supabase.rpc("recompute_user_xp", { p_user_id: user.id });
    if (rpcError) throw rpcError;

    if (existingLog?.course_id) {
      const { data: course } = await supabase
        .from("courses")
        .select("id, total_units")
        .eq("id", existingLog.course_id)
        .eq("user_id", user.id)
        .single();

      if (course) {
        const { data: allLogs } = await supabase
          .from("learning_logs")
          .select("units_completed")
          .eq("course_id", existingLog.course_id)
          .eq("user_id", user.id);

        const completedUnits = Math.min(
          course.total_units || 1,
          (allLogs || []).reduce((sum, entry) => sum + (entry.units_completed || 0), 0)
        );

        await supabase
          .from("courses")
          .update({
            completed_units: completedUnits,
            status: completedUnits >= (course.total_units || 1) ? "completed" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLog.course_id)
          .eq("user_id", user.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
