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

-- Create simple, permissive policies for testing
CREATE POLICY "Allow all operations on government_staff" ON government_staff
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on citizens" ON citizens
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on issues" ON issues
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on issue_updates" ON issue_updates
    FOR ALL USING (true) WITH CHECK (true);
