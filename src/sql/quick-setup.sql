-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS issue_updates CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS citizens CASCADE;
DROP TABLE IF EXISTS government_staff CASCADE;

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
-- Allow public read access to government_staff for login
CREATE POLICY "Public can read government staff for login" ON government_staff
    FOR SELECT USING (true);

-- Citizens policies
CREATE POLICY "Anyone can register as citizen" ON citizens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Citizens can view their own data" ON citizens
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Citizens can update their own data" ON citizens
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Issues policies  
CREATE POLICY "Anyone can view issues" ON issues
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create issues" ON issues
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update issues" ON issues
    FOR UPDATE USING (true);

-- Issue updates policies
CREATE POLICY "Anyone can view issue updates" ON issue_updates
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create issue updates" ON issue_updates
    FOR INSERT WITH CHECK (true);
