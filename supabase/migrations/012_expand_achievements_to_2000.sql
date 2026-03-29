-- Expand achievement catalog to exactly 2,000 total entries without deleting existing unlocks.
-- This version tops up from the current count instead of assuming exactly 100 existing rows.

do $$
declare
  target_total integer := 2000;
  total_before integer;
  total_added integer := 0;
  remaining integer;
  idx integer;
  xp_value integer;
  xp_reward integer;
  streak_value integer;
  level_value integer;
  milestone_value integer;
begin
  select count(*) into total_before from public.achievements;
  remaining := target_total - total_before;

  if remaining <= 0 then
    raise notice 'Achievements already at % entries, skipping expansion.', total_before;
    return;
  end if;

  -- XP milestones: up to 300 entries
  for idx in 1..300 loop
    exit when total_added >= remaining;
    xp_value := idx * 250;
    xp_reward := least(10000, 25 + (idx * 8));

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('XP Horizon %s', idx),
      format('Reach %s total XP', to_char(xp_value, 'FM999,999,999')),
      '✨',
      'total_xp',
      xp_value,
      xp_reward,
      'progression'
    );

    total_added := total_added + 1;
  end loop;

  -- Level milestones: up to 200 entries
  for idx in 1..200 loop
    exit when total_added >= remaining;
    level_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Level Ladder %s', idx),
      format('Reach level %s', level_value),
      '⭐',
      'level',
      level_value,
      least(10000, 40 + (idx * 20)),
      'progression'
    );

    total_added := total_added + 1;
  end loop;

  -- Streak milestones: up to 150 entries
  for idx in 1..150 loop
    exit when total_added >= remaining;
    streak_value := idx * 2;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Streak Keeper %s', idx),
      format('Maintain a %s-day streak', streak_value),
      '🔥',
      'streak_days',
      streak_value,
      least(10000, 30 + (idx * 18)),
      'streaks'
    );

    total_added := total_added + 1;
  end loop;

  -- Courses enrolled: up to 150 entries
  for idx in 1..150 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Course Collector %s', idx),
      format('Add %s courses', milestone_value),
      '📚',
      'courses_enrolled',
      milestone_value,
      least(8000, 20 + (idx * 12)),
      'courses'
    );

    total_added := total_added + 1;
  end loop;

  -- Courses completed: up to 150 entries
  for idx in 1..150 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Course Finisher %s', idx),
      format('Complete %s courses', milestone_value),
      '🎓',
      'courses_completed',
      milestone_value,
      least(10000, 50 + (idx * 18)),
      'courses'
    );

    total_added := total_added + 1;
  end loop;

  -- Learning log count: up to 150 entries
  for idx in 1..150 loop
    exit when total_added >= remaining;
    milestone_value := idx * 5;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Journal Chain %s', idx),
      format('Write %s learning logs', milestone_value),
      '📝',
      'logs_count',
      milestone_value,
      least(8000, 20 + (idx * 10)),
      'learning_logs'
    );

    total_added := total_added + 1;
  end loop;

  -- Learning log words: up to 150 entries
  for idx in 1..150 loop
    exit when total_added >= remaining;
    milestone_value := idx * 1000;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Wordsmith %s', idx),
      format('Write %s total words in learning logs', to_char(milestone_value, 'FM999,999,999')),
      '✍️',
      'logs_words',
      milestone_value,
      least(9000, 25 + (idx * 12)),
      'learning_logs'
    );

    total_added := total_added + 1;
  end loop;

  -- Projects added: up to 100 entries
  for idx in 1..100 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Project Forge %s', idx),
      format('Add %s projects', milestone_value),
      '🛠️',
      'projects_added',
      milestone_value,
      least(7000, 20 + (idx * 14)),
      'projects'
    );

    total_added := total_added + 1;
  end loop;

  -- Projects completed: up to 100 entries
  for idx in 1..100 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Shipyard %s', idx),
      format('Complete %s projects', milestone_value),
      '✅',
      'projects_completed',
      milestone_value,
      least(10000, 50 + (idx * 20)),
      'projects'
    );

    total_added := total_added + 1;
  end loop;

  -- Roadmaps enrolled: up to 75 entries
  for idx in 1..75 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Path Starter %s', idx),
      format('Start %s roadmaps', milestone_value),
      '🗺️',
      'roadmaps_enrolled',
      milestone_value,
      least(7000, 35 + (idx * 18)),
      'roadmaps'
    );

    total_added := total_added + 1;
  end loop;

  -- Roadmaps completed: up to 75 entries
  for idx in 1..75 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Path Master %s', idx),
      format('Complete %s roadmaps', milestone_value),
      '🏁',
      'roadmaps_completed',
      milestone_value,
      least(10000, 80 + (idx * 24)),
      'roadmaps'
    );

    total_added := total_added + 1;
  end loop;

  -- Nodes completed: up to 100 entries
  for idx in 1..100 loop
    exit when total_added >= remaining;
    milestone_value := idx * 5;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Node Runner %s', idx),
      format('Complete %s roadmap nodes', milestone_value),
      '🧩',
      'nodes_completed',
      milestone_value,
      least(9000, 30 + (idx * 16)),
      'roadmaps'
    );

    total_added := total_added + 1;
  end loop;

  -- Skills tracked: up to 100 entries
  for idx in 1..100 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Skill Web %s', idx),
      format('Track %s skills', milestone_value),
      '🕸️',
      'skills_tracked',
      milestone_value,
      least(7000, 20 + (idx * 14)),
      'skills'
    );

    total_added := total_added + 1;
  end loop;

  -- Max skill level: up to 100 entries
  for idx in 1..100 loop
    exit when total_added >= remaining;
    milestone_value := idx;

    insert into public.achievements (
      title,
      description,
      icon,
      requirement_type,
      requirement_value,
      xp_reward,
      category
    ) values (
      format('Skill Summit %s', idx),
      format('Reach level %s in any skill', milestone_value),
      '🏔️',
      'skill_max_level',
      milestone_value,
      least(10000, 40 + (idx * 18)),
      'skills'
    );

    total_added := total_added + 1;
  end loop;

  -- Repeatable special flavor achievements: up to 100 entries
  for idx in 1..25 loop
    exit when total_added >= remaining;
    insert into public.achievements (title, description, icon, requirement_type, requirement_value, xp_reward, category)
    values (format('Night Shift %s', idx), 'Post a learning log after midnight', '🦉', 'special_night_owl', 1, 250 + (idx * 20), 'special');
    total_added := total_added + 1;

    exit when total_added >= remaining;
    insert into public.achievements (title, description, icon, requirement_type, requirement_value, xp_reward, category)
    values (format('Sunrise Sprint %s', idx), 'Post a learning log before 6 AM', '🌅', 'special_early_bird', 1, 250 + (idx * 20), 'special');
    total_added := total_added + 1;

    exit when total_added >= remaining;
    insert into public.achievements (title, description, icon, requirement_type, requirement_value, xp_reward, category)
    values (format('Daily Marathon %s', idx), 'Post 5 learning logs in a single day', '🏃', 'special_marathon', 1, 400 + (idx * 30), 'special');
    total_added := total_added + 1;

    exit when total_added >= remaining;
    insert into public.achievements (title, description, icon, requirement_type, requirement_value, xp_reward, category)
    values (format('Deep Work %s', idx), 'Write 500 words in a single learning log', '🧠', 'special_deep_focus', 1, 500 + (idx * 35), 'special');
    total_added := total_added + 1;
  end loop;

  if total_before + total_added <> target_total then
    raise exception 'Expected to end at % achievements, but got % before and % added.', target_total, total_before, total_added;
  end if;

  raise notice 'Achievement catalog expanded from % to % entries.', total_before, total_before + total_added;
end $$;
