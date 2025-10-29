-- Update citizens table to include profile verification fields
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS name_per_aadhaar VARCHAR(100);
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS dob_per_aadhaar DATE;
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS fathers_name VARCHAR(100);
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(15);
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS aadhaar_image_url TEXT;
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';

-- Update existing records to have default values
UPDATE citizens SET 
  is_verified = COALESCE(is_verified, FALSE),
  profile_completed = COALESCE(profile_completed, FALSE),
  verification_status = COALESCE(verification_status, 'pending')
WHERE is_verified IS NULL OR profile_completed IS NULL OR verification_status IS NULL;

-- Add constraints
ALTER TABLE citizens ADD CONSTRAINT check_gender CHECK (gender IN ('Male', 'Female', 'Other'));
ALTER TABLE citizens ADD CONSTRAINT check_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected'));
