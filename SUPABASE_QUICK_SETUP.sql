-- =================================================================
-- QUICK SUPABASE SETUP - Copy and run in Supabase SQL Editor
-- Project: mmluzuxcoqyrtenstxq
-- =================================================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create custom types
DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM (
      'Super Admin', 'Administrator', 'HR Manager', 'Department Head',
      'Teacher', 'Support Staff', 'Security', 'Maintenance'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM (
      'Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM (
      'present', 'present_late', 'absent', 'on_leave', 'half_day',
      'work_from_home', 'official_duty', 'public_holiday', 'weekend', 'compensatory_off'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM (
      'sick', 'casual', 'annual', 'maternity', 'paternity',
      'unpaid', 'compassionate', 'study', 'sabbatical'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create tables
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    photo_url TEXT,
    role staff_role NOT NULL,
    department VARCHAR(100),
    employment_type employment_type,
    shift_id UUID REFERENCES shifts(id),
    date_joined DATE NOT NULL,
    pin VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    emergency_contact JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biometric_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    device_info JSONB,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL,
    is_late BOOLEAN DEFAULT false,
    location JSONB,
    device_info JSONB,
    notes TEXT,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_staff_id ON staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_pin ON staff(pin);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, attendance_date);

-- Step 6: Insert default shift
INSERT INTO shifts (shift_name, start_time, end_time, grace_period_minutes)
SELECT 'Regular Shift', '08:00:00', '17:00:00', 15
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE shift_name = 'Regular Shift');

-- Step 7: Insert admin staff
INSERT INTO staff (staff_id, first_name, last_name, email, role, department, employment_type, date_joined, is_active)
SELECT 'ADMIN001', 'System', 'Administrator', 'admin@timeattendance.edu', 'Super Admin', 'Administration', 'Full-time', CURRENT_DATE, true
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE staff_id = 'ADMIN001');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Database setup completed!' as message;
