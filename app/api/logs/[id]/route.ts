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
    const { units_completed, summary, skills } = json;

    const { data: log, error } = await supabase
      .from("learning_logs")
      .update({
        units_completed,
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    // Handle skills (delete existing, insert new ones)
    if (skills && Array.isArray(skills)) {
      await supabase
        .from("learning_log_skills")
        .delete()
        .eq("log_id", params.id);
        
      if (skills.length > 0) {
        // Resolve skill names to IDs
        const skillMappings = await Promise.all(
          skills.map(async (skillName: string) => {
            const { data: existingSkill } = await supabase
              .from("skills")
              .select("id")
              .ilike("name", skillName)
              .maybeSingle();

            if (existingSkill) return existingSkill.id;

            const { data: newSkill } = await supabase
              .from("skills")
              .insert({ name: skillName, category: "Custom" })
              .select("id")
              .single();
              
            return newSkill?.id;
          })
        );

        const validSkills = skillMappings.filter(Boolean);
        if (validSkills.length > 0) {
          await supabase.from("learning_log_skills").insert(
            validSkills.map((sid) => ({ log_id: params.id, skill_id: sid }))
          );
        }
      }
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
    const { error } = await supabase
      .from("learning_logs")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;

    // Recalculate XP
    const { error: rpcError } = await supabase.rpc("recompute_user_xp", { p_user_id: user.id });
    if (rpcError) throw rpcError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
