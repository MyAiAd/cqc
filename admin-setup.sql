-- Admin Setup and Sample Data Script
-- Run this AFTER the main database schema setup

-- 1. Update user roles to include super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff', 'manager', 'super_admin'));

-- 2. Create function to automatically create user records when someone signs in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  practice_record practices%ROWTYPE;
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Extract domain from email
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Special handling for super admin
  IF NEW.email = 'Sage@MyAi.ad' THEN
    -- Find or create the admin practice
    SELECT * INTO practice_record FROM practices WHERE email_domain = 'myai.ad';
    IF practice_record IS NULL THEN
      INSERT INTO practices (id, name, email_domain, subscription_tier)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium');
      SELECT * INTO practice_record FROM practices WHERE email_domain = 'myai.ad';
    END IF;
    user_role := 'super_admin';
    user_name := 'Sage (Super Admin)';
  ELSE
    -- Find practice by email domain
    SELECT * INTO practice_record FROM practices WHERE email_domain = email_domain;
    IF practice_record IS NULL THEN
      -- Create a new practice for this domain
      INSERT INTO practices (name, email_domain, subscription_tier)
      VALUES (initcap(replace(email_domain, '.', ' ')), email_domain, 'free')
      RETURNING * INTO practice_record;
    END IF;
    user_role := 'admin'; -- First user in a practice becomes admin
    user_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Create user record
  INSERT INTO public.users (id, practice_id, email, name, role)
  VALUES (NEW.id, practice_record.id, NEW.email, user_name, user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create safe, non-recursive RLS policies
-- IMPORTANT: These policies avoid infinite recursion by not querying the users table 
-- to check permissions on the users table itself

-- USERS TABLE: Use auth.email() and auth.uid() directly (no table lookups)
DROP POLICY IF EXISTS "Users can access their own user data" ON users;
CREATE POLICY "users_safe_access" ON users
FOR ALL
USING (
    -- Users can access their own record
    id = auth.uid() 
    OR 
    -- Super admin can access all records (using email from JWT, no table lookup)
    auth.email() = 'sage@myai.ad'
);

-- PRACTICES TABLE: Safe policy using direct auth functions
DROP POLICY IF EXISTS "Super admin can access all practices" ON practices;
DROP POLICY IF EXISTS "Users can access their own practice" ON practices;
CREATE POLICY "practices_safe_access" ON practices
FOR ALL
USING (
    -- Super admin can access all practices
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access their practice (safe lookup)
    id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- STAFF TABLE: Safe policy
DROP POLICY IF EXISTS "Users can access their practice staff" ON staff;
CREATE POLICY "staff_safe_access" ON staff
FOR ALL
USING (
    -- Super admin can access all staff
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access staff in their practice
    practice_id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- TASKS TABLE: Safe policy
DROP POLICY IF EXISTS "Users can access their practice tasks" ON tasks;
CREATE POLICY "tasks_safe_access" ON tasks
FOR ALL
USING (
    -- Super admin can access all tasks
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access tasks in their practice
    practice_id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- COMPETENCIES TABLE: Safe policy
DROP POLICY IF EXISTS "Users can access their practice competencies" ON competencies;
CREATE POLICY "competencies_safe_access" ON competencies
FOR ALL
USING (
    -- Super admin can access all competencies
    auth.email() = 'sage@myai.ad'
    OR
    -- Regular users can access competencies in their practice
    practice_id IN (SELECT practice_id FROM users WHERE id = auth.uid())
);

-- 4. Create sample practices
INSERT INTO practices (id, name, email_domain, subscription_tier) VALUES 
('00000000-0000-0000-0000-000000000001', 'Harmony Admin', 'myai.ad', 'premium'),
('00000000-0000-0000-0000-000000000002', 'Greenwood Medical Centre', 'greenwood-medical.nhs.uk', 'basic'),
('00000000-0000-0000-0000-000000000003', 'Riverside Health Practice', 'riverside-health.co.uk', 'premium'),
('00000000-0000-0000-0000-000000000004', 'City Centre GP Surgery', 'citycentregp.nhs.uk', 'free')
ON CONFLICT (email_domain) DO NOTHING;

-- 5. Create sample staff for each practice
-- Greenwood Medical Centre staff
INSERT INTO staff (id, practice_id, name, email, role, department) VALUES 
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Dr. Sarah Wilson', 'sarah.wilson@greenwood-medical.nhs.uk', 'GP Partner', 'Clinical'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Nurse Emma Thompson', 'emma.thompson@greenwood-medical.nhs.uk', 'Practice Nurse', 'Clinical'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Mark Johnson', 'mark.johnson@greenwood-medical.nhs.uk', 'Practice Manager', 'Management'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Lisa Brown', 'lisa.brown@greenwood-medical.nhs.uk', 'Receptionist', 'Administration'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Dr. Michael Chen', 'michael.chen@greenwood-medical.nhs.uk', 'GP', 'Clinical');

-- Riverside Health Practice staff
INSERT INTO staff (id, practice_id, name, email, role, department) VALUES 
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'Dr. Jennifer Davis', 'jennifer.davis@riverside-health.co.uk', 'Senior Partner', 'Clinical'),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'Nurse Paul Anderson', 'paul.anderson@riverside-health.co.uk', 'Advanced Nurse Practitioner', 'Clinical'),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Helen Roberts', 'helen.roberts@riverside-health.co.uk', 'Quality Manager', 'Quality Assurance'),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'James Taylor', 'james.taylor@riverside-health.co.uk', 'IT Support', 'Technical');

-- City Centre GP Surgery staff
INSERT INTO staff (id, practice_id, name, email, role, department) VALUES 
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'Dr. Amanda White', 'amanda.white@citycentregp.nhs.uk', 'GP', 'Clinical'),
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', 'Sophie Miller', 'sophie.miller@citycentregp.nhs.uk', 'Practice Manager', 'Management'),
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', 'Tom Wilson', 'tom.wilson@citycentregp.nhs.uk', 'Healthcare Assistant', 'Clinical');

-- 6. Create sample tasks for each practice
-- Greenwood Medical Centre tasks
INSERT INTO tasks (id, practice_id, name, description, category, risk_rating, owner) VALUES
('b082d77a-24a6-4171-a083-92f7500586e2', '00000000-0000-0000-0000-000000000002', 'Annual Fire Safety Training', 'Ensure all staff complete the annual fire safety training module and assessment.', 'Continuous', 'High', 'Practice Manager');

-- Riverside Health Practice tasks
INSERT INTO tasks (id, practice_id, name, description, category, risk_rating, owner) VALUES
('f2d9e8c4-6a53-4b9e-8e7a-1c3b5d8f7c9a', '00000000-0000-0000-0000-000000000003', 'Patient Medicine Reviews', 'Review medications for patients with long-term conditions.', 'Monthly', 'High', 'Lead GP');

-- City Centre GP Surgery tasks
INSERT INTO tasks (id, practice_id, name, description, category, risk_rating, owner) VALUES
('e8a3b5c1-9d2f-4a7b-8c1d-6f9a3b2e5d7c', '00000000-0000-0000-0000-000000000004', 'Daily Equipment Safety Checks', 'Check and record the status of all critical medical equipment at the start of each day.', 'Daily', 'Medium', 'Nurse Practitioner');

-- 7. Create sample competencies
-- Greenwood Medical Centre competencies
INSERT INTO competencies (practice_id, task_id, staff_id, status) VALUES 
-- Daily Equipment Safety Checks
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Competent'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Training Required'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Competent'),

-- Patient Medicine Reviews
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Competent'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'Competent'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Trained awaiting sign off'),

-- Infection Control Audit
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Competent'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Re-Training Required'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Not Applicable');

-- Riverside Health Practice competencies
INSERT INTO competencies (practice_id, task_id, staff_id, status) VALUES 
('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000008', 'Competent'),
('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'Training Required'),
('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Competent'),
('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', 'Competent');

-- City Centre GP Surgery competencies  
INSERT INTO competencies (practice_id, task_id, staff_id, status) VALUES 
('00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000011', 'Competent'),
('00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000012', 'Training Required'),
('00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000010', 'Competent'),
('00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000011', 'Trained awaiting sign off');

-- Success message
SELECT 'Admin setup and sample data inserted successfully!' as result; 