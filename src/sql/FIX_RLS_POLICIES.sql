-- Fix Row Level Security Policies for Issues Table
-- Run this in Supabase SQL Editor

-- 1. Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'issues';

-- 2. Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'issues';

-- 3. OPTION A: Disable RLS temporarily for testing (EASIEST)
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- 4. OPTION B: Create permissive policies (RECOMMENDED for production)
-- Uncomment these if you want to keep RLS enabled:

/*
-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON issues;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON issues;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON issues;

-- Create new permissive policies
CREATE POLICY "Allow all SELECT on issues"
ON issues FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow all INSERT on issues"
ON issues FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on issues"
ON issues FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all DELETE on issues"
ON issues FOR DELETE
TO public
USING (true);
*/

-- 5. Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'issues';

-- 6. Test query
SELECT id, issue_id, priority, priority_score 
FROM issues 
LIMIT 5;
