-- Insert massive achievement seed (100+)
-- Update constraint to allow new categories
alter table achievements drop constraint if exists achievements_category_check;
alter table achievements add constraint achievements_category_check check (category in ('courses', 'projects', 'streaks', 'xp', 'skills', 'roadmaps', 'learning_logs', 'special', 'progression'));

-- Clear existing achievements first to cleanly insert
delete from achievements;

-- Insert achievements
-- (Format: title, description, icon, requirement_type, requirement_value, xp_reward, category)
insert into achievements (title, description, icon, requirement_type, requirement_value, xp_reward, category) values
-- Progression (Levels & XP)
('First Blood', 'Earn your first XP', '✨', 'total_xp', 10, 50, 'progression'),
('Initiate', 'Reach 100 Total XP', '🥉', 'total_xp', 100, 100, 'progression'),
('Apprentice', 'Reach 500 Total XP', '🥈', 'total_xp', 500, 250, 'progression'),
('Adept', 'Reach 1,000 Total XP', '🥇', 'total_xp', 1000, 500, 'progression'),
('Expert', 'Reach 5,000 Total XP', '💎', 'total_xp', 5000, 1000, 'progression'),
('Master', 'Reach 10,000 Total XP', '👑', 'total_xp', 10000, 2000, 'progression'),
('Grandmaster', 'Reach 50,000 Total XP', '🔱', 'total_xp', 50000, 5000, 'progression'),
('Level 5 Reached', 'Achieve Level 5', '⭐', 'level', 5, 100, 'progression'),
('Level 10 Reached', 'Achieve Level 10', '🌟', 'level', 10, 250, 'progression'),
('Level 25 Reached', 'Achieve Level 25', '🌠', 'level', 25, 1000, 'progression'),
('Level 50 Reached', 'Achieve Level 50', '🌌', 'level', 50, 5000, 'progression'),
('Level 100 Cap', 'Achieve Level 100', '💯', 'level', 100, 10000, 'progression'),

-- Streaks
('Hatching', 'Maintain a 3-day streak', '🥚', 'streak_days', 3, 50, 'streaks'),
('Consistency', 'Maintain a 7-day streak', '🔥', 'streak_days', 7, 100, 'streaks'),
('Momentum', 'Maintain a 14-day streak', '🚀', 'streak_days', 14, 250, 'streaks'),
('Habitual', 'Maintain a 30-day streak', '📅', 'streak_days', 30, 500, 'streaks'),
('Unstoppable', 'Maintain a 60-day streak', '🚂', 'streak_days', 60, 1000, 'streaks'),
('Century Mark', 'Maintain a 100-day streak', '💯', 'streak_days', 100, 2000, 'streaks'),
('Half Year', 'Maintain a 180-day streak', '⏳', 'streak_days', 180, 5000, 'streaks'),
('A Full Year', 'Maintain a 365-day streak', '🌞', 'streak_days', 365, 10000, 'streaks'),

-- Courses
('Enrolled', 'Add your first course', '📚', 'courses_enrolled', 1, 50, 'courses'),
('Curious Learner', 'Add 5 courses', '🎒', 'courses_enrolled', 5, 100, 'courses'),
('Course Collector', 'Add 10 courses', '🛒', 'courses_enrolled', 10, 200, 'courses'),
('Library Builder', 'Add 25 courses', '🏛️', 'courses_enrolled', 25, 500, 'courses'),
('Course Completed', 'Complete your very first course', '🎓', 'courses_completed', 1, 200, 'courses'),
('Triple Threat', 'Complete 3 courses', '🎖️', 'courses_completed', 3, 500, 'courses'),
('Scholar', 'Complete 10 courses', '📜', 'courses_completed', 10, 1500, 'courses'),
('Polymath', 'Complete 25 courses', '🔭', 'courses_completed', 25, 3000, 'courses'),
('Dean’s List', 'Complete 50 courses', '🏛️', 'courses_completed', 50, 5000, 'courses'),
('Professor', 'Complete 100 courses', '🧠', 'courses_completed', 100, 10000, 'courses'),

-- Learning Logs
('First Reflection', 'Write your first learning log', '📝', 'logs_count', 1, 50, 'learning_logs'),
('Diarist', 'Write 10 learning logs', '📔', 'logs_count', 10, 150, 'learning_logs'),
('Chronicler', 'Write 50 learning logs', '📖', 'logs_count', 50, 500, 'learning_logs'),
('Historian', 'Write 100 learning logs', '📚', 'logs_count', 100, 1000, 'learning_logs'),
('Archivist', 'Write 500 learning logs', '🗄️', 'logs_count', 500, 3000, 'learning_logs'),
('Scribe', 'Write a total of 1,000 words in learning logs', '🖋️', 'logs_words', 1000, 200, 'learning_logs'),
('Author', 'Write a total of 10,000 words in learning logs', '✍️', 'logs_words', 10000, 1000, 'learning_logs'),
('Novelist', 'Write a total of 50,000 words in learning logs', '📖', 'logs_words', 50000, 5000, 'learning_logs'),

-- Projects
('Builder', 'Add your first project', '🔨', 'projects_added', 1, 50, 'projects'),
('Crafter', 'Add 5 projects', '🛠️', 'projects_added', 5, 200, 'projects'),
('Creator', 'Add 10 projects', '⚙️', 'projects_added', 10, 500, 'projects'),
('First Output', 'Complete your first project', '✅', 'projects_completed', 1, 300, 'projects'),
('Portfolio Starter', 'Complete 3 projects', '🚀', 'projects_completed', 3, 1000, 'projects'),
('Ship It', 'Complete 10 projects', '🚢', 'projects_completed', 10, 2500, 'projects'),
('Factory', 'Complete 25 projects', '🏭', 'projects_completed', 25, 5000, 'projects'),
('Industry Leader', 'Complete 50 projects', '🌆', 'projects_completed', 50, 10000, 'projects'),

-- Roadmaps
('The Journey Begins', 'Start your first roadmap', '🗺️', 'roadmaps_enrolled', 1, 100, 'roadmaps'),
('Navigator', 'Start 3 roadmaps', '🧭', 'roadmaps_enrolled', 3, 250, 'roadmaps'),
('Pathfinder', 'Complete your first roadmap', '🏁', 'roadmaps_completed', 1, 1000, 'roadmaps'),
('Trailblazer', 'Complete 3 roadmaps', '🏕️', 'roadmaps_completed', 3, 2500, 'roadmaps'),
('Visionary', 'Complete 5 roadmaps', '🌟', 'roadmaps_completed', 5, 5000, 'roadmaps'),

-- Roadmaps Workflow Nodes
('First Step', 'Check off your first roadmap node', '🐾', 'nodes_completed', 1, 50, 'roadmaps'),
('Ten Steps', 'Check off 10 roadmap nodes', '👣', 'nodes_completed', 10, 200, 'roadmaps'),
('Workflow Master', 'Check off 50 roadmap nodes', '🧩', 'nodes_completed', 50, 1000, 'roadmaps'),
('Graph Conqueror', 'Check off 100 roadmap nodes', '🕸️', 'nodes_completed', 100, 2000, 'roadmaps'),
('Node Specialist', 'Check off 250 roadmap nodes', '📡', 'nodes_completed', 250, 5000, 'roadmaps'),

-- Skills
('Talent Acquired', 'Unlock your first skill', '✨', 'skills_tracked', 1, 50, 'skills'),
('Multi-talented', 'Track 5 skills', '🤹', 'skills_tracked', 5, 150, 'skills'),
('Jack of all Trades', 'Track 10 skills', '🃏', 'skills_tracked', 10, 300, 'skills'),
('Skill Collector', 'Track 25 skills', '🧩', 'skills_tracked', 25, 750, 'skills'),
('Skill Arsenal', 'Track 50 skills', '⚔️', 'skills_tracked', 50, 2000, 'skills'),

-- Skill Levels (Assuming skill level reaches max at 100)
('Beginner', 'Reach level 5 in any skill', '🌱', 'skill_max_level', 5, 100, 'skills'),
('Amateur', 'Reach level 10 in any skill', '🌿', 'skill_max_level', 10, 250, 'skills'),
('Professional', 'Reach level 25 in any skill', '🌳', 'skill_max_level', 25, 1000, 'skills'),
('Virtuoso', 'Reach level 50 in any skill', '🎭', 'skill_max_level', 50, 5000, 'skills'),
('Legend', 'Reach level 100 in any skill', '🎖️', 'skill_max_level', 100, 10000, 'skills'),

-- Special / Rare / Consistency
('Morning Person', 'Login for 7 consecutive days', '🌞', 'streak_days', 7, 200, 'special'),
('Monthly Devotee', 'Login for 30 consecutive days', '📅', 'streak_days', 30, 1000, 'special'),
('Quarterly Committer', 'Login for 90 consecutive days', '📆', 'streak_days', 90, 3000, 'special'),

('Night Owl', 'Post a learning log after midnight', '🦉', 'special_night_owl', 1, 500, 'special'),
('Early Bird', 'Post a learning log before 6 AM', '🌅', 'special_early_bird', 1, 500, 'special'),
('Marathon', 'Post 5 learning logs in a single day', '🏃', 'special_marathon', 1, 1000, 'special'),
('Deep Focus', 'Write 500 words in a single log', '🧘', 'special_deep_focus', 1, 1500, 'special'),

('XP Tier 2', 'Reach 2,000 Total XP', '✨', 'total_xp', 2000, 100, 'progression'),
('XP Tier 3', 'Reach 3,000 Total XP', '✨', 'total_xp', 3000, 100, 'progression'),
('XP Tier 4', 'Reach 4,000 Total XP', '✨', 'total_xp', 4000, 100, 'progression'),
('XP Tier 6', 'Reach 6,000 Total XP', '✨', 'total_xp', 6000, 100, 'progression'),
('XP Tier 7', 'Reach 7,000 Total XP', '✨', 'total_xp', 7000, 100, 'progression'),
('XP Tier 8', 'Reach 8,000 Total XP', '✨', 'total_xp', 8000, 100, 'progression'),
('XP Tier 9', 'Reach 9,000 Total XP', '✨', 'total_xp', 9000, 100, 'progression'),
('XP Tier 11', 'Reach 11,000 Total XP', '✨', 'total_xp', 11000, 100, 'progression'),

('Course Count 2', 'Add 2 courses', '📚', 'courses_enrolled', 2, 50, 'courses'),
('Course Count 4', 'Add 4 courses', '📚', 'courses_enrolled', 4, 50, 'courses'),
('Course Count 6', 'Add 6 courses', '📚', 'courses_enrolled', 6, 50, 'courses'),
('Course Count 8', 'Add 8 courses', '📚', 'courses_enrolled', 8, 50, 'courses'),

('Completed Course 2', 'Complete 2 courses', '🎓', 'courses_completed', 2, 100, 'courses'),
('Completed Course 4', 'Complete 4 courses', '🎓', 'courses_completed', 4, 100, 'courses'),
('Completed Course 6', 'Complete 6 courses', '🎓', 'courses_completed', 6, 100, 'courses'),
('Completed Course 8', 'Complete 8 courses', '🎓', 'courses_completed', 8, 100, 'courses'),

('Project Count 2', 'Add 2 projects', '🔨', 'projects_added', 2, 50, 'projects'),
('Project Count 3', 'Add 3 projects', '🔨', 'projects_added', 3, 50, 'projects'),
('Project Count 4', 'Add 4 projects', '🔨', 'projects_added', 4, 50, 'projects'),
('Project Count 6', 'Add 6 projects', '🔨', 'projects_added', 6, 50, 'projects'),

('Completed Project 2', 'Complete 2 projects', '✅', 'projects_completed', 2, 100, 'projects'),
('Completed Project 4', 'Complete 4 projects', '✅', 'projects_completed', 4, 100, 'projects'),
('Completed Project 5', 'Complete 5 projects', '✅', 'projects_completed', 5, 100, 'projects'),
('Completed Project 6', 'Complete 6 projects', '✅', 'projects_completed', 6, 100, 'projects'),

('Log Count 5', 'Write 5 learning logs', '📝', 'logs_count', 5, 50, 'learning_logs'),
('Log Count 20', 'Write 20 learning logs', '📝', 'logs_count', 20, 50, 'learning_logs'),
('Log Count 30', 'Write 30 learning logs', '📝', 'logs_count', 30, 50, 'learning_logs'),
('Log Count 40', 'Write 40 learning logs', '📝', 'logs_count', 40, 50, 'learning_logs'),
('Log Count 60', 'Write 60 learning logs', '📝', 'logs_count', 60, 50, 'learning_logs'),
('Log Count 70', 'Write 70 learning logs', '📝', 'logs_count', 70, 50, 'learning_logs'),
('Log Count 80', 'Write 80 learning logs', '📝', 'logs_count', 80, 50, 'learning_logs'),
('Log Count 90', 'Write 90 learning logs', '📝', 'logs_count', 90, 50, 'learning_logs'),

('Skill Count 2', 'Track 2 skills', '⭐', 'skills_tracked', 2, 50, 'skills'),
('Skill Count 3', 'Track 3 skills', '⭐', 'skills_tracked', 3, 50, 'skills'),
('Skill Count 4', 'Track 4 skills', '⭐', 'skills_tracked', 4, 50, 'skills'),
('Skill Count 6', 'Track 6 skills', '⭐', 'skills_tracked', 6, 50, 'skills'),
('Skill Count 7', 'Track 7 skills', '⭐', 'skills_tracked', 7, 50, 'skills'),
('Skill Count 8', 'Track 8 skills', '⭐', 'skills_tracked', 8, 50, 'skills'),
('Skill Count 9', 'Track 9 skills', '⭐', 'skills_tracked', 9, 50, 'skills'),
('Skill Count 15', 'Track 15 skills', '⭐', 'skills_tracked', 15, 50, 'skills')
;
