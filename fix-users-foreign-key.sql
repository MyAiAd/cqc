-- Fix users table foreign key constraint to allow admin-created users
-- This removes the foreign key constraint on users.id so we can create users with temporary UUIDs

-- First, let's see what constraints exist
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Drop the foreign key constraint on users.id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Verify the constraint is removed
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Update the handle_new_user trigger to handle the new flow better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  practice_record practices%ROWTYPE;
  user_role TEXT;
  user_name TEXT;
  existing_user_record users%ROWTYPE;
BEGIN
  -- Extract domain from email (case insensitive)
  email_domain := LOWER(split_part(NEW.email, '@', 2));
  
  -- Check if there's already a user record for this email (created by admin)
  SELECT * INTO existing_user_record 
  FROM users 
  WHERE LOWER(email) = LOWER(NEW.email) AND created_by_admin = true;
  
  IF existing_user_record IS NOT NULL THEN
    -- Update the existing record with the real auth ID and preserve admin-assigned role
    UPDATE users 
    SET id = NEW.id, 
        created_by_admin = false,
        updated_at = NOW()
    WHERE LOWER(email) = LOWER(NEW.email) AND created_by_admin = true;
    
    RAISE NOTICE 'Updated existing admin-created user record for % with role %', NEW.email, existing_user_record.role;
    RETURN NEW;
  END IF;
  
  -- Special handling for sage@myai.ad
  IF LOWER(NEW.email) = 'sage@myai.ad' THEN
    -- Ensure admin practice exists
    INSERT INTO practices (id, name, email_domain, subscription_tier)
    VALUES ('00000000-0000-0000-0000-000000000001', 'System Administration', 'myai.ad', 'premium')
    ON CONFLICT (email_domain) DO UPDATE SET 
      name = EXCLUDED.name,
      subscription_tier = EXCLUDED.subscription_tier;
    
    SELECT * INTO practice_record FROM practices WHERE email_domain = 'myai.ad';
    user_role := 'super_admin';
    user_name := 'Sage (Super Admin)';
  ELSE
    -- Find or create practice for this domain
    SELECT * INTO practice_record FROM practices WHERE LOWER(practices.email_domain) = email_domain;
    
    IF practice_record IS NULL THEN
      -- Create a new practice for this domain
      INSERT INTO practices (name, email_domain, subscription_tier)
      VALUES (initcap(replace(email_domain, '.', ' ')), email_domain, 'basic')
      RETURNING * INTO practice_record;
    END IF;
    
    user_role := 'admin'; -- Default role for new signups
    user_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Create user record (only if no existing record was found)
  INSERT INTO public.users (id, practice_id, email, name, role, created_by_admin)
  VALUES (NEW.id, practice_record.id, LOWER(NEW.email), user_name, user_role, false)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    practice_id = EXCLUDED.practice_id,
    created_by_admin = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the setup
SELECT 'Fixed users foreign key constraint and updated trigger!' as result; 