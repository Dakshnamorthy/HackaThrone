-- Create storage bucket for issue images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-images', 'issue-images', true);

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload issue images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'issue-images' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to issue images
CREATE POLICY "Allow public read access to issue images" ON storage.objects
FOR SELECT USING (bucket_id = 'issue-images');

-- Create policy to allow users to update their own images
CREATE POLICY "Allow users to update their own issue images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own issue images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
