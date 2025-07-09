-- Setup Basic Practices for Super Admin
-- Run this in your Supabase SQL Editor

-- Ensure the MyAi.ad admin practice exists for sage@myai.ad
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Create some sample practices for testing
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000002', 'Greenwood Medical Centre', 'greenwood-medical.nhs.uk', 'basic'),
('00000000-0000-0000-0000-000000000003', 'Riverside Health Practice', 'riverside-health.co.uk', 'premium'),
('00000000-0000-0000-0000-000000000004', 'City Centre GP Surgery', 'citycentregp.nhs.uk', 'free')
ON CONFLICT (email_domain) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Verify the practices were created
SELECT 'Practices created successfully:' as status;
SELECT id, name, email_domain, subscription_tier FROM practices ORDER BY name;

-- Check if sage@myai.ad user exists and update if needed
DO $$
DECLARE
  sage_user_id UUID;
  admin_practice_id UUID;
BEGIN
  -- Get sage's user ID from auth.users
  SELECT id INTO sage_user_id FROM auth.users WHERE LOWER(email) = 'sage@myai.ad';
  
  IF sage_user_id IS NOT NULL THEN
    -- Get admin practice ID
    SELECT id INTO admin_practice_id FROM practices WHERE email_domain = 'myai.ad';
    
    -- Ensure user record exists with super_admin role
    INSERT INTO users (id, practice_id, email, name, role)
    VALUES (sage_user_id, admin_practice_id, 'sage@myai.ad', 'Sage (Super Admin)', 'super_admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      name = 'Sage (Super Admin)',
      practice_id = admin_practice_id;
      
    RAISE NOTICE 'Updated sage@myai.ad user record with super_admin role';
  ELSE
    RAISE NOTICE 'sage@myai.ad not found in auth.users - user needs to sign in first';
  END IF;
END $$;

SELECT 'Setup complete!' as result; 