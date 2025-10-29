-- Drop existing tables if they exist
DROP TABLE IF EXISTS issue_updates CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS citizens CASCADE;
DROP TABLE IF EXISTS government_staff CASCADE;

-- Create government_staff table (unchanged)
CREATE TABLE government_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unique_id VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    contact VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create citizens table (updated to work with Supabase Auth)
CREATE TABLE citizens (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255), -- Keep for compatibility with government login system
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table
CREATE TABLE issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id VARCHAR(20) UNIQUE NOT NULL,
    citizen_id UUID REFERENCES citizens(id),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'Pending',
    priority VARCHAR(10) DEFAULT 'Medium',
    assigned_to UUID REFERENCES government_staff(id),
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issue_updates table
CREATE TABLE issue_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID REFERENCES issues(id),
    updated_by UUID REFERENCES government_staff(id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert government staff data
INSERT INTO government_staff (unique_id, password, department, name, gender, dob, contact, email, address) VALUES
('ELEC001', 'KaRt#1981', 'Electrical Department', 'Mr. R. Karthikeyan', 'Male', '1981-03-12', '9876543210', 'rkarthikeyan.elec@tnmuni.gov.in', 'No. 24, Gandhi Street, Erode – 638001'),
('ELEC002', 'DiVy@1988', 'Electrical Department', 'Ms. P. Divya', 'Female', '1988-07-26', '9842067895', 'pdivya.elec@tnmuni.gov.in', '14, Bharathi Nagar, Coimbatore – 641002'),
('SANI001', 'SeLv$1982', 'Sanitation / Solid Waste Management Department', 'Mr. A. Selvam', 'Male', '1982-05-03', '9876078901', 'aselvam.sani@tnmuni.gov.in', '19, Muthuramalingam Road, Tirunelveli – 627002'),
('SANI002', 'MeEn%1990', 'Sanitation / Solid Waste Management Department', 'Ms. R. Meenakshi', 'Female', '1990-09-30', '9500034567', 'rmeenakshi.sani@tnmuni.gov.in', '8, Kamarajar Street, Trichy – 620018'),
('PWD001', 'RaJe&1979', 'Public Works Department (PWD)', 'Mr. S. Rajendran', 'Male', '1979-02-09', '9884567890', 'srajendran.pwd@tnmuni.gov.in', '45, Anna Salai, Salem – 636007'),
('PWD002', 'KaVi*1985', 'Public Works Department (PWD)', 'Mrs. M. Kavitha', 'Female', '1985-11-15', '9790065432', 'mkavitha.pwd@tnmuni.gov.in', '22, Periyar Street, Madurai – 625010');

-- Enable Row Level Security
ALTER TABLE government_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Government staff policies
CREATE POLICY "Allow all operations on government_staff" ON government_staff
    FOR ALL USING (true) WITH CHECK (true);

-- Citizens policies
CREATE POLICY "Users can insert their own citizen record" ON citizens
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own citizen record" ON citizens
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own citizen record" ON citizens
    FOR UPDATE USING (auth.uid() = id);

-- Issues policies
CREATE POLICY "Users can view all issues" ON issues
    FOR SELECT USING (true);

CREATE POLICY "Users can insert issues" ON issues
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Users can update their own issues" ON issues
    FOR UPDATE USING (auth.uid() = citizen_id);

CREATE POLICY "Government staff can update all issues" ON issues
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM government_staff WHERE id = auth.uid()
    ));

-- Issue updates policies
CREATE POLICY "Allow all operations on issue_updates" ON issue_updates
    FOR ALL USING (true) WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.citizens (id, name, email, is_verified)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create citizen record when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update citizen verification status
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.citizens
        SET is_verified = true
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update citizen verification when email is confirmed
CREATE OR REPLACE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Create function to generate issue ID
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
        ELSE dept_prefix := 'GEN';
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
CREATE TRIGGER generate_issue_id_trigger
    BEFORE INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION generate_issue_id();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_government_staff_updated_at BEFORE UPDATE ON government_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
