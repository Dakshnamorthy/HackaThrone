-- Drop all existing policies
DROP POLICY IF EXISTS "Public can read government staff for login" ON government_staff;
DROP POLICY IF EXISTS "Government staff can view their own data" ON government_staff;
DROP POLICY IF EXISTS "Anyone can register as citizen" ON citizens;
DROP POLICY IF EXISTS "Citizens can view their own data" ON citizens;
DROP POLICY IF EXISTS "Citizens can update their own data" ON citizens;
DROP POLICY IF EXISTS "Anyone can view issues" ON issues;
DROP POLICY IF EXISTS "Anyone can create issues" ON issues;
DROP POLICY IF EXISTS "Anyone can update issues" ON issues;
DROP POLICY IF EXISTS "Anyone can view issue updates" ON issue_updates;
DROP POLICY IF EXISTS "Anyone can create issue updates" ON issue_updates;

-- Enable RLS on issues table (if not already enabled)
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "government_can_update_issues" ON issues;
DROP POLICY IF EXISTS "government_can_read_issues" ON issues;
DROP POLICY IF EXISTS "authenticated_can_read_issues" ON issues;
DROP POLICY IF EXISTS "government_can_insert_issues" ON issues;
DROP POLICY IF EXISTS "allow_all_operations" ON issues;

-- Create a comprehensive policy that allows all operations for authenticated users
CREATE POLICY "allow_all_operations" ON issues
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to authenticated role
GRANT ALL ON issues TO authenticated;

-- Also grant permissions on the sequence (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create simple, permissive policies for testing
CREATE POLICY "Allow all operations on government_staff" ON government_staff
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on citizens" ON citizens
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on issue_updates" ON issue_updates
    FOR ALL USING (true) WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'issues';

-- Test query to verify access
-- SELECT 'RLS policies configured successfully' as status;
