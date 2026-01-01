-- Debug RLS policies and table structure

-- 1. Check if tables exist and have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'routines', 'workout_logs');

-- 2. Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'routines', 'workout_logs')
ORDER BY tablename, policyname;

-- 3. Check table structure for routines
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'routines'
ORDER BY ordinal_position;

-- 4. Test auth.uid() function
SELECT auth.uid() as current_user_id;

-- 5. Test direct query (this should work if RLS is properly configured)
-- Replace 'your-user-id' with actual user ID from auth.users
-- SELECT * FROM routines WHERE user_id = 'your-user-id' AND is_active = true;

-- 6. Check if there are any routines in the table
SELECT COUNT(*) as total_routines FROM routines;

-- 7. Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('profiles', 'routines', 'workout_logs')
AND tc.table_schema = 'public';