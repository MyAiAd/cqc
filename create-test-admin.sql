-- Create Test Admin Setup for RiseWith.us (SAFE VERSION)
-- Run this in your Supabase SQL Editor

-- 1. Clean up any partial data from previous attempts
DELETE FROM users WHERE email = 'sage@risewith.us' OR id = '22222222-2222-2222-2222-222222222222';
DELETE FROM practices WHERE id = '11111111-1111-1111-1111-111111111111' OR email_domain = 'risewith.us';

-- 2. Create a practice for RiseWith.us
INSERT INTO practices (id, name, email_domain, subscription_tier)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'RiseWith Healthcare', 
  'risewith.us', 
  'premium'
);

-- 3. Verify the practice was created
SELECT 'Practice created successfully:' as status, * FROM practices WHERE email_domain = 'risewith.us';

-- 4. Show next steps
SELECT 'SETUP COMPLETE!' as status,
       'Practice "RiseWith Healthcare" created for domain risewith.us' as result;

SELECT 'NEXT STEPS:' as instruction, 
       '1. Go to your app sign-up page' as step1,
       '2. Sign up with email: sage@risewith.us' as step2,
       '3. The system will auto-assign you to RiseWith Healthcare practice' as step3,
       '4. You can then manually update your role to admin if needed' as step4;

-- 5. Optional: Show how to manually set admin role after signup
SELECT 'AFTER SIGNUP - Run this to make the user an admin:' as note,
       'UPDATE users SET role = ''admin'', name = ''Sage (Test Admin)'' WHERE email = ''sage@risewith.us'';' as command; 