-- Create government_staff table
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

-- Create citizens table
CREATE TABLE citizens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues/complaints table
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
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issue_updates table for tracking status changes
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

-- Enable Row Level Security (RLS)
ALTER TABLE government_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for government_staff table
CREATE POLICY "Government staff can view their own data" ON government_staff
    FOR SELECT USING (auth.uid()::text = id::text);

-- Create policies for citizens table
-- Allow anyone to insert (for registration)
CREATE POLICY "Anyone can register as citizen" ON citizens
    FOR INSERT WITH CHECK (true);

-- Citizens can view their own data
CREATE POLICY "Citizens can view their own data" ON citizens
    FOR SELECT USING (auth.uid()::text = id::text);

-- Citizens can update their own data
CREATE POLICY "Citizens can update their own data" ON citizens
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for issues table
CREATE POLICY "Citizens can view their own issues" ON issues
    FOR SELECT USING (citizen_id::text = auth.uid()::text);

CREATE POLICY "Citizens can create issues" ON issues
    FOR INSERT WITH CHECK (citizen_id::text = auth.uid()::text);

CREATE POLICY "Government staff can view all issues" ON issues
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM government_staff WHERE id::text = auth.uid()::text
    ));

CREATE POLICY "Government staff can update issues" ON issues
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM government_staff WHERE id::text = auth.uid()::text
    ));

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
