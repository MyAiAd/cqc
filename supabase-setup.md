# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/in and create a new project
3. Choose EU region for GDPR compliance
4. Copy your project URL and anon key

## Step 2: Add Environment Variables

Create a `.env` file in your project root with:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Step 3: Run Database Schema

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Enable RLS and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create practices table (top-level tenant isolation)
CREATE TABLE practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email_domain TEXT NOT NULL UNIQUE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff table (practice staff members)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create statements table (global, not practice-specific)
CREATE TABLE harmony360_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table (practice-specific)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Continuous', 'Daily', 'Weekly', 'Monthly', 'Quarterly')),
  sop_link TEXT,
  policy_link TEXT,
  risk_rating TEXT DEFAULT 'Medium' CHECK (risk_rating IN ('Low', 'Medium', 'High')),
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create competencies table (practice-specific)
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Competent', 'Training Required', 'Re-Training Required', 'Trained awaiting sign off', 'Not Applicable')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, staff_id)
);

-- Enable Row Level Security
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for practice isolation
CREATE POLICY "Users can access their own practice" ON practices
  FOR ALL USING (id = (SELECT practice_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can access their own user data" ON users
  FOR ALL USING (id = auth.uid() OR practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can access their practice staff" ON staff
  FOR ALL USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can access their practice tasks" ON tasks
  FOR ALL USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can access their practice competencies" ON competencies
  FOR ALL USING (practice_id = (SELECT practice_id FROM users WHERE id = auth.uid()));

-- statements are global (no RLS needed)
CREATE POLICY "Everyone can read statements" ON harmony360_statements
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_users_practice_id ON users(practice_id);
CREATE INDEX idx_staff_practice_id ON staff(practice_id);
CREATE INDEX idx_tasks_practice_id ON tasks(practice_id);
CREATE INDEX idx_competencies_practice_id ON competencies(practice_id);
CREATE INDEX idx_competencies_task_staff ON competencies(task_id, staff_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 4: Seed Statements

-- Insert I Statements and Quality Statements from the official document
INSERT INTO harmony360_statements (category, type, text) VALUES
('Safe', 'I statement', 'I feel and am safe and protected from abuse and avoidable harm.'),
-- ... Add all other statements from the provided document here
('Well-led', 'Quality statement', 'We have a culture of high-quality, sustainable care.');

-- After running this script, you will have a fully set up Supabase backend
-- for the Harmony360 application.

## Next Steps

After running the SQL:
1. Update your `.env` file with actual Supabase credentials
2. Run `npm run dev` to test the connection
3. We'll integrate the Supabase client into your existing components 