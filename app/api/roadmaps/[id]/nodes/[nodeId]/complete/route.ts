import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { setRoadmapNodeCompletionState } from "@/lib/progression";

export async function POST(
  request: Request,
  { params }: { params: { id: string; nodeId: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: node } = await supabase
    .from("roadmap_nodes")
    .select("id, roadmap_id, skill_id")
    .eq("id", params.nodeId)
    .maybeSingle();

  if (!node || node.roadmap_id !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const completed = Boolean(body.completed);

  let result = await setRoadmapNodeCompletionState(
    supabase,
    user.id,
    params.nodeId,
    completed
  );

  if (!result.success) {
    const { data: previous } = await supabase
      .from("user_roadmap_node_state")
      .select("completed")
      .eq("user_id", user.id)
      .eq("node_id", params.nodeId)
      .maybeSingle();

    const wasCompleted = previous?.completed ?? false;

    const { error: stateError } = await supabase.from("user_roadmap_node_state").upsert(
      {
        user_id: user.id,
        node_id: params.nodeId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,node_id" }
    );

    if (stateError) {
      return NextResponse.json({ error: stateError.message }, { status: 400 });
    }

    let xpAwarded = 0;
    const { data: nodeSkills } = await supabase
      .from("roadmap_node_skills")
      .select("skill_id")
      .eq("node_id", params.nodeId);

    const skillIds = Array.from(
      new Set([
        ...(nodeSkills || []).map((entry) => entry.skill_id),
        ...(node.skill_id ? [node.skill_id] : []),
      ])
    );
    const xpPerSkill = skillIds.length > 0 ? Math.floor(10 / skillIds.length) : 0;

    if (completed && !wasCompleted) {
      const primarySkillId = skillIds[0] ?? null;
      await supabase.from("xp_logs").insert(
        {
          user_id: user.id,
          source_type: "roadmap_node",
          source_id: params.nodeId,
          amount: 10,
          skill_id: primarySkillId,
        }
      );

      for (const skillId of skillIds) {
        const { data: existingSkill } = await supabase
          .from("user_skills")
          .select("xp, level")
          .eq("user_id", user.id)
          .eq("skill_id", skillId)
          .maybeSingle();

        const nextXp = (existingSkill?.xp || 0) + xpPerSkill;

        if (existingSkill) {
          await supabase
            .from("user_skills")
            .update({
              xp: nextXp,
              level: Math.floor(nextXp / 100),
            })
            .eq("user_id", user.id)
            .eq("skill_id", skillId);
        } else {
          await supabase.from("user_skills").insert({
            user_id: user.id,
            skill_id: skillId,
            xp: xpPerSkill,
            level: Math.floor(xpPerSkill / 100),
          });
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", user.id)
        .single();

      const totalXp = (profile?.total_xp || 0) + 10;
      await supabase
        .from("profiles")
        .update({
          total_xp: totalXp,
          level: Math.floor(totalXp / 100),
        })
        .eq("id", user.id);

      xpAwarded = 10;
    } else if (!completed && wasCompleted) {
      await supabase
        .from("xp_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("source_type", "roadmap_node")
        .eq("source_id", params.nodeId);

      for (const skillId of skillIds) {
        const { data: existingSkill } = await supabase
          .from("user_skills")
          .select("xp, level")
          .eq("user_id", user.id)
          .eq("skill_id", skillId)
          .maybeSingle();

        if (!existingSkill) continue;

        const nextXp = Math.max(0, existingSkill.xp - xpPerSkill);

        await supabase
          .from("user_skills")
          .update({
            xp: nextXp,
            level: Math.floor(nextXp / 100),
          })
          .eq("user_id", user.id)
          .eq("skill_id", skillId);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", user.id)
        .single();

      const totalXp = Math.max(0, (profile?.total_xp || 0) - 10);
      await supabase
        .from("profiles")
        .update({
          total_xp: totalXp,
          level: Math.floor(totalXp / 100),
        })
        .eq("id", user.id);
    }

    result = { success: true, xpAwarded };
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, xp_awarded: result.xpAwarded ?? 0 });
}
