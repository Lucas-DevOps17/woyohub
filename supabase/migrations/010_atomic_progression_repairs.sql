-- ============================================
-- Migration 010: Atomic progression repairs
-- Description: transactional XP/streak reward functions and achievement persistence
-- ============================================

create or replace function public.upsert_user_skill_xp(
  p_user_id uuid,
  p_skill_id uuid,
  p_xp_amount integer
) returns void
language plpgsql
security definer
as $$
begin
  if p_skill_id is null or p_xp_amount <= 0 then
    return;
  end if;

  insert into public.user_skills (user_id, skill_id, xp, level)
  values (p_user_id, p_skill_id, p_xp_amount, floor(p_xp_amount / 100))
  on conflict (user_id, skill_id)
  do update
  set xp = public.user_skills.xp + excluded.xp,
      level = floor((public.user_skills.xp + excluded.xp) / 100),
      updated_at = now();
end;
$$;

grant execute on function public.upsert_user_skill_xp(uuid, uuid, integer) to authenticated;

create or replace function public.award_course_xp_atomic(
  p_user_id uuid,
  p_course_id uuid,
  p_skill_id uuid default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_xp_amount integer := 50;
begin
  if exists (
    select 1
    from public.xp_logs
    where user_id = p_user_id
      and source_type = 'course'
      and source_id = p_course_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Course XP already awarded');
  end if;

  insert into public.xp_logs (user_id, source_type, source_id, amount, skill_id)
  values (p_user_id, 'course', p_course_id, v_xp_amount, p_skill_id);

  perform public.upsert_user_skill_xp(p_user_id, p_skill_id, v_xp_amount);
  perform public.increment_user_xp(p_user_id, v_xp_amount);

  return jsonb_build_object('success', true, 'xp_awarded', v_xp_amount);
end;
$$;

grant execute on function public.award_course_xp_atomic(uuid, uuid, uuid) to authenticated;

create or replace function public.award_lesson_xp_atomic(
  p_user_id uuid,
  p_lesson_id uuid,
  p_course_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_skill_id uuid;
  v_total_units integer;
  v_completed_units integer;
  v_lesson_completed boolean;
  v_new_completed_units integer;
  v_xp_amount integer := 10;
begin
  select
    c.skill_id,
    c.total_units,
    c.completed_units,
    l.completed
  into
    v_skill_id,
    v_total_units,
    v_completed_units,
    v_lesson_completed
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.id = p_lesson_id
    and c.id = p_course_id
    and c.user_id = p_user_id
  for update of l, c;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Course or lesson not found');
  end if;

  if coalesce(v_lesson_completed, false) then
    return jsonb_build_object('success', false, 'error', 'Lesson already completed');
  end if;

  update public.lessons
  set completed = true,
      completed_at = now()
  where id = p_lesson_id;

  v_new_completed_units := least(coalesce(v_completed_units, 0) + 1, greatest(coalesce(v_total_units, 1), 1));

  update public.courses
  set completed_units = v_new_completed_units,
      status = case
        when v_new_completed_units >= greatest(coalesce(v_total_units, 1), 1) then 'completed'
        else 'active'
      end,
      updated_at = now()
  where id = p_course_id;

  insert into public.xp_logs (user_id, source_type, source_id, amount, skill_id)
  values (p_user_id, 'lesson', p_lesson_id, v_xp_amount, v_skill_id);

  perform public.upsert_user_skill_xp(p_user_id, v_skill_id, v_xp_amount);
  perform public.increment_user_xp(p_user_id, v_xp_amount);

  if v_new_completed_units >= greatest(coalesce(v_total_units, 1), 1) then
    perform public.award_course_xp_atomic(p_user_id, p_course_id, v_skill_id);
  end if;

  return jsonb_build_object('success', true, 'xp_awarded', v_xp_amount);
end;
$$;

grant execute on function public.award_lesson_xp_atomic(uuid, uuid, uuid) to authenticated;

create or replace function public.award_project_xp_atomic(
  p_user_id uuid,
  p_project_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_xp integer := 100;
  v_skill_count integer := 0;
  v_primary_skill_id uuid;
  v_xp_per_skill integer := 100;
  v_skill_id uuid;
begin
  if not exists (
    select 1
    from public.projects
    where id = p_project_id
      and user_id = p_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Project not found');
  end if;

  if exists (
    select 1
    from public.xp_logs
    where user_id = p_user_id
      and source_type = 'project'
      and source_id = p_project_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Project XP already awarded');
  end if;

  select count(*), min(skill_id)
  into v_skill_count, v_primary_skill_id
  from public.project_skills
  where project_id = p_project_id;

  if v_skill_count > 0 then
    v_xp_per_skill := floor(v_total_xp / v_skill_count);
  end if;

  insert into public.xp_logs (user_id, source_type, source_id, amount, skill_id)
  values (p_user_id, 'project', p_project_id, v_total_xp, v_primary_skill_id);

  if v_skill_count > 0 then
    for v_skill_id in
      select skill_id
      from public.project_skills
      where project_id = p_project_id
    loop
      perform public.upsert_user_skill_xp(p_user_id, v_skill_id, v_xp_per_skill);
    end loop;
  end if;

  perform public.increment_user_xp(p_user_id, v_total_xp);

  return jsonb_build_object('success', true, 'xp_awarded', v_total_xp);
end;
$$;

grant execute on function public.award_project_xp_atomic(uuid, uuid) to authenticated;

create or replace function public.award_daily_login_xp_atomic(
  p_user_id uuid,
  p_today date
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_profile public.profiles%rowtype;
  v_xp_amount integer := 5;
  v_new_streak integer := 1;
  v_longest_streak integer := 0;
  v_is_streak_day boolean := false;
  v_missed_days integer := 0;
  v_new_freeze_count integer := 0;
begin
  select *
  into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_profile.last_activity_date = p_today then
    return jsonb_build_object('success', true, 'xp_awarded', 0, 'is_streak_day', false);
  end if;

  v_new_freeze_count := coalesce(v_profile.streak_freeze_count, 0);

  if v_profile.last_activity_date is not null then
    if v_profile.last_activity_date = (p_today - 1) then
      v_new_streak := coalesce(v_profile.current_streak, 0) + 1;
      v_is_streak_day := true;
    else
      v_missed_days := greatest((p_today - v_profile.last_activity_date) - 1, 0);

      if v_missed_days > 0 and v_new_freeze_count >= v_missed_days then
        v_new_freeze_count := v_new_freeze_count - v_missed_days;
        v_new_streak := coalesce(v_profile.current_streak, 0) + 1;
        v_is_streak_day := true;
      else
        v_new_streak := 1;
      end if;
    end if;
  end if;

  v_longest_streak := greatest(v_new_streak, coalesce(v_profile.longest_streak, 0));

  insert into public.xp_logs (user_id, source_type, source_id, amount, skill_id)
  values (p_user_id, 'daily_login', null, v_xp_amount, null);

  update public.profiles
  set total_xp = coalesce(total_xp, 0) + v_xp_amount,
      level = floor((coalesce(total_xp, 0) + v_xp_amount) / 100),
      current_streak = v_new_streak,
      longest_streak = v_longest_streak,
      last_activity_date = p_today,
      streak_freeze_count = v_new_freeze_count,
      updated_at = now()
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'xp_awarded', v_xp_amount,
    'is_streak_day', v_is_streak_day
  );
end;
$$;

grant execute on function public.award_daily_login_xp_atomic(uuid, date) to authenticated;

create or replace function public.award_roadmap_node_xp_atomic(
  p_user_id uuid,
  p_node_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_xp integer := 10;
  v_skill_count integer := 0;
  v_primary_skill_id uuid;
  v_xp_per_skill integer := 10;
  v_skill_id uuid;
begin
  if exists (
    select 1
    from public.xp_logs
    where user_id = p_user_id
      and source_type = 'roadmap_node'
      and source_id = p_node_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Roadmap node XP already awarded');
  end if;

  select count(*), min(skill_id)
  into v_skill_count, v_primary_skill_id
  from public.roadmap_node_skills
  where node_id = p_node_id;

  if v_skill_count > 0 then
    v_xp_per_skill := floor(v_total_xp / v_skill_count);
  end if;

  insert into public.xp_logs (user_id, source_type, source_id, amount, skill_id)
  values (p_user_id, 'roadmap_node', p_node_id, v_total_xp, v_primary_skill_id);

  if v_skill_count > 0 then
    for v_skill_id in
      select skill_id
      from public.roadmap_node_skills
      where node_id = p_node_id
    loop
      perform public.upsert_user_skill_xp(p_user_id, v_skill_id, v_xp_per_skill);
    end loop;
  end if;

  perform public.increment_user_xp(p_user_id, v_total_xp);

  return jsonb_build_object('success', true, 'xp_awarded', v_total_xp);
end;
$$;

grant execute on function public.award_roadmap_node_xp_atomic(uuid, uuid) to authenticated;

create or replace function public.set_roadmap_node_completion_atomic(
  p_user_id uuid,
  p_node_id uuid,
  p_completed boolean
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_previous_completed boolean := false;
  v_xp_result jsonb;
begin
  if not exists (select 1 from public.roadmap_nodes where id = p_node_id) then
    return jsonb_build_object('success', false, 'error', 'Roadmap node not found');
  end if;

  select completed
  into v_previous_completed
  from public.user_roadmap_node_state
  where user_id = p_user_id
    and node_id = p_node_id
  for update;

  v_previous_completed := coalesce(v_previous_completed, false);

  insert into public.user_roadmap_node_state (user_id, node_id, completed, completed_at)
  values (p_user_id, p_node_id, p_completed, case when p_completed then now() else null end)
  on conflict (user_id, node_id)
  do update
  set completed = excluded.completed,
      completed_at = excluded.completed_at;

  if p_completed and not v_previous_completed then
    v_xp_result := public.award_roadmap_node_xp_atomic(p_user_id, p_node_id);
    return v_xp_result;
  end if;

  if not p_completed and v_previous_completed then
    perform public.recompute_user_xp(p_user_id);
  end if;

  return jsonb_build_object('success', true, 'xp_awarded', 0);
end;
$$;

grant execute on function public.set_roadmap_node_completion_atomic(uuid, uuid, boolean) to authenticated;

create or replace function public.award_achievements_atomic(
  p_user_id uuid,
  p_achievement_ids uuid[]
) returns uuid[]
language plpgsql
security definer
as $$
declare
  v_inserted_ids uuid[] := '{}';
  v_bonus_xp integer := 0;
begin
  with inserted as (
    insert into public.user_achievements (user_id, achievement_id)
    select p_user_id, achievement_id
    from unnest(p_achievement_ids) as achievement_id
    on conflict (user_id, achievement_id) do nothing
    returning achievement_id
  )
  select coalesce(array_agg(achievement_id), '{}')
  into v_inserted_ids
  from inserted;

  if coalesce(array_length(v_inserted_ids, 1), 0) = 0 then
    return '{}';
  end if;

  insert into public.xp_logs (user_id, source_type, source_id, amount, skill_id)
  select
    p_user_id,
    'achievement',
    a.id,
    a.xp_reward,
    null
  from public.achievements a
  where a.id = any(v_inserted_ids)
    and a.xp_reward > 0;

  select coalesce(sum(a.xp_reward), 0)
  into v_bonus_xp
  from public.achievements a
  where a.id = any(v_inserted_ids);

  if v_bonus_xp > 0 then
    perform public.increment_user_xp(p_user_id, v_bonus_xp);
  end if;

  return v_inserted_ids;
end;
$$;

grant execute on function public.award_achievements_atomic(uuid, uuid[]) to authenticated;
