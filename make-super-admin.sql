-- This script updates the user with the specified email address to have the 'super_admin' role.
-- This will grant them the highest level of permissions in the Harmony360 application.

UPDATE public.users
SET role = 'super_admin'
WHERE email = 'Sage@MyAi.ad';

-- After running this, the user should log out and log back in to see the changes. 