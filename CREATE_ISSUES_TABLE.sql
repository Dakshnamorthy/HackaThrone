-- ========================================
-- CREATE ISSUES TABLE FOR FORM SUBMISSION
-- ========================================

-- Create the issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id VARCHAR(20) UNIQUE NOT NULL DEFAULT 'CIV-' || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 100000)::TEXT, 5, '0'),
    citizen_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
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

-- Create function to auto-generate issue IDs
CREATE OR REPLACE FUNCTION generate_issue_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate simple issue ID with timestamp
    NEW.issue_id := 'CIV-' || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 100000)::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating issue IDs
DROP TRIGGER IF EXISTS generate_issue_id_trigger ON issues;
CREATE TRIGGER generate_issue_id_trigger
    BEFORE INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION generate_issue_id();

-- Enable Row Level Security
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all issues" ON issues;
DROP POLICY IF EXISTS "Users can insert issues" ON issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON issues;

CREATE POLICY "Users can view all issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Users can insert issues" ON issues FOR INSERT WITH CHECK (auth.uid() = citizen_id);
CREATE POLICY "Users can update their own issues" ON issues FOR UPDATE USING (auth.uid() = citizen_id);

-- Test the table creation
SELECT 'Issues table created successfully!' as message;
