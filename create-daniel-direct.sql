-- Direct user creation methods if Supabase Dashboard fails
-- Try these in order until one works

-- Method 1: Admin function (most reliable)
SELECT auth.admin_create_user(
  email := 'daniel@hcqc.co.uk',
  password := 'mJtXkqWmChC5',
  email_confirm := true
) as user_id;

-- Method 2: If admin function doesn't exist, try this simpler version
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert user into auth.users with minimal required fields
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'daniel@hcqc.co.uk',
    crypt('mJtXkqWmChC5', gen_salt('bf')),
    now(),
    now(),
    now()
  ) RETURNING id INTO new_user_id;
  
  RAISE NOTICE 'User created successfully with ID: %', new_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User already exists with email daniel@hcqc.co.uk';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: % - %', SQLSTATE, SQLERRM;
END $$; 