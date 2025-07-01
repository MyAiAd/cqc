-- Fix the email case mismatch
-- This updates the email in public.users to match the case you're using to log in

UPDATE public.users 
SET email = 'Sage@MyAi.ad'
WHERE email = 'sage@myai.ad';

-- Verify the update
SELECT id, practice_id, email, name, role 
FROM public.users 
WHERE email = 'Sage@MyAi.ad'; 