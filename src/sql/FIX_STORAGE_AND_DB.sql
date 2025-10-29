-- ========================================
-- FIX 1: CREATE STORAGE BUCKET
-- ========================================

-- Create the issue-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'issue-images', 
  'issue-images', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- ========================================
-- FIX 2: CREATE STORAGE POLICIES
-- ========================================

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload issue images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'issue-images' AND 
  auth.role() = 'authenticated'
);

-- Policy: Allow public read access to images
CREATE POLICY "Allow public read access to issue images" ON storage.objects
FOR SELECT USING (bucket_id = 'issue-images');

-- Policy: Allow users to update their own images
CREATE POLICY "Allow users to update their own issue images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Allow users to delete their own issue images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- FIX 3: VERIFY/CREATE ISSUES TABLE
-- ========================================

-- Check if issues table exists, if not create it
CREATE TABLE IF NOT EXISTS issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id VARCHAR(20) UNIQUE NOT NULL,
    citizen_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'Pending',
    priority VARCHAR(10) DEFAULT 'Medium',
    assigned_to UUID,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FIX 4: CREATE ISSUE ID GENERATION FUNCTION
-- ========================================

-- Function to generate issue IDs
CREATE OR REPLACE FUNCTION generate_issue_id()
RETURNS TRIGGER AS $$
DECLARE
    dept_prefix TEXT;
    counter INTEGER;
BEGIN
    -- Get department prefix based on issue type
    CASE NEW.type
        WHEN 'Electrical' THEN dept_prefix := 'ELEC';
        WHEN 'Garbage', 'Sanitation' THEN dept_prefix := 'SANI';
        WHEN 'Road', 'Infrastructure' THEN dept_prefix := 'PWD';
        ELSE dept_prefix := 'CIV';
    END CASE;
    
    -- Get next counter for this department
    SELECT COALESCE(MAX(CAST(SUBSTRING(issue_id FROM LENGTH(dept_prefix) + 2) AS INTEGER)), 0) + 1
    INTO counter
    FROM issues
    WHERE issue_id LIKE dept_prefix || '%';
    
    -- Generate issue ID
    NEW.issue_id := dept_prefix || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating issue IDs
DROP TRIGGER IF EXISTS generate_issue_id_trigger ON issues;
CREATE TRIGGER generate_issue_id_trigger
    BEFORE INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION generate_issue_id();

-- ========================================
-- FIX 5: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable Row Level Security
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all issues
CREATE POLICY "Users can view all issues" ON issues
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert issues
CREATE POLICY "Users can insert issues" ON issues
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

-- Policy: Users can update their own issues
CREATE POLICY "Users can update their own issues" ON issues
    FOR UPDATE USING (auth.uid() = citizen_id);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'issue-images';

-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'issues';

-- Check RLS policies on issues table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'issues';

-- Test bucket access (this will show if policies work)
SELECT bucket_id, name FROM storage.objects WHERE bucket_id = 'issue-images' LIMIT 1;
