-- Ensure learning_logs supports editing/deleting cleanly
alter table learning_logs
add column if not exists updated_at timestamptz default now();

-- Drop existing function if any
drop function if exists recompute_user_xp;

-- Source-of-truth recompute system
create or replace function recompute_user_xp(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_total_xp int := 0;
  v_daily_login_xp int := 0;
begin

  -- Delete all existing user_skills as we will recalculate from scratch
  delete from user_skills where user_id = p_user_id;

  -- 1. Learning logs XP
  insert into user_skills (user_id, skill_id, xp, level)
  select
    p_user_id,
    lls.skill_id,
    count(ll.id) * 10 as xp,
    floor((count(ll.id) * 10) / 100) as level
  from learning_logs ll
  join learning_log_skills lls on lls.log_id = ll.id
  where ll.user_id = p_user_id
  group by lls.skill_id
  on conflict (user_id, skill_id)
  do update set xp = user_skills.xp + excluded.xp, level = floor((user_skills.xp + excluded.xp) / 100);

  -- 2. Projects XP (Distribute 100 XP per project across its skills)
  -- For accuracy based on our past implementation, we distribute Math.floor(100 / count(skills))
  -- But an easier SQL approach is just 100 XP per skill if we want to be generous, or exact distribution.
  -- The prompt specifies: count(*) * 100 per skill. Let's follow the prompt's SQL snippet for projects:
  insert into user_skills (user_id, skill_id, xp, level)
  select
    p_user_id,
    ps.skill_id,
    count(p.id) * 100 as xp,
    floor((count(p.id) * 100) / 100) as level
  from projects p
  join project_skills ps on ps.project_id = p.id
  where p.user_id = p_user_id
    and p.status = 'completed'
  group by ps.skill_id
  on conflict (user_id, skill_id)
  do update set xp = user_skills.xp + excluded.xp, level = floor((user_skills.xp + excluded.xp) / 100);

  -- 3. Roadmap node XP (completed nodes)
  insert into user_skills (user_id, skill_id, xp, level)
  select
    p_user_id,
    rns.skill_id,
    count(urs.node_id) * 10 as xp,
    floor((count(urs.node_id) * 10) / 100) as level
  from user_roadmap_node_state urs
  join roadmap_nodes rn on rn.id = urs.node_id
  join roadmap_node_skills rns on rns.node_id = rn.id
  where urs.user_id = p_user_id
    and urs.completed = true
  group by rns.skill_id
  on conflict (user_id, skill_id)
  do update set xp = user_skills.xp + excluded.xp, level = floor((user_skills.xp + excluded.xp) / 100);

  -- 4. Calculate total XP from skills
  select coalesce(sum(xp), 0) into v_total_xp
  from user_skills
  where user_id = p_user_id;

  -- 5. Add Daily Login XP and Achievement XP directly from xp_logs to total_xp
  select coalesce(sum(amount), 0) into v_daily_login_xp
  from xp_logs
  where user_id = p_user_id
    and source_type in ('daily_login', 'achievement');

  v_total_xp := v_total_xp + v_daily_login_xp;

  -- 6. Update profiles with the newly computed total_xp
  update profiles 
  set total_xp = v_total_xp,
      level = floor(v_total_xp / 100)
  where id = p_user_id;

  -- 7. Clean up xp_logs to match our new truth
  -- We don't necessarily delete the logs, they are good for history,
  -- but we must ensure we don't double count if we ever rely on them over skills.
  -- The prompt's system makes user_skills and specific xp_logs the source of truth!

end;
$$;
