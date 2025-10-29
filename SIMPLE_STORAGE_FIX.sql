-- ========================================
-- SIMPLE STORAGE BUCKET CREATION
-- ========================================

-- Step 1: Create the storage bucket (run this first)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload issue images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to issue images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own issue images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own issue images" ON storage.objects;

-- Step 4: Create simple, permissive policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'issue-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'issue-images' AND auth.role() = 'authenticated');

-- ========================================
-- VERIFY BUCKET CREATION
-- ========================================

-- This should return one row with your bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'issue-images';
