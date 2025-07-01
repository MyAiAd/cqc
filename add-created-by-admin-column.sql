-- Add created_by_admin column to users table
-- This tracks users that were created by admins and are awaiting signup

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_users_created_by_admin ON users(created_by_admin);

-- Update the handle_new_user trigger to handle pre-existing user records
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
    -- Update the existing record with the real auth ID
    UPDATE users 
    SET id = NEW.id, 
        created_by_admin = false,
        updated_at = NOW()
    WHERE LOWER(email) = LOWER(NEW.email) AND created_by_admin = true;
    
    RAISE NOTICE 'Updated existing admin-created user record for %', NEW.email;
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
  
  -- Create user record
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
SELECT 'Added created_by_admin column and updated trigger!' as result; 