-- Normalize all email addresses to lowercase for case-insensitive authentication
-- This ensures consistent email handling across the application

-- First, let's see what emails currently exist
SELECT id, email, name, role 
FROM users 
ORDER BY email;

-- Update all email addresses to lowercase in the users table
UPDATE users 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Verify the update
SELECT id, email, name, role 
FROM users 
ORDER BY email;

-- Also update any email addresses in the auth.users table if needed
-- Note: This might not be necessary as Supabase typically handles this automatically
-- But let's check what's there
SELECT id, email, created_at 
FROM auth.users 
ORDER BY email; 