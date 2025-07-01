-- Debug script to check user profile data
-- Run this in your Supabase SQL Editor to see what's in the database

-- Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'Sage@MyAi.ad';

-- Check if the user exists in public.users
SELECT id, practice_id, email, name, role, created_at, updated_at
FROM public.users 
WHERE email = 'Sage@MyAi.ad';

-- Check all users to see what's there
SELECT id, practice_id, email, name, role 
FROM public.users 
ORDER BY created_at DESC; 