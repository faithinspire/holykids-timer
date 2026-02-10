# 🚀 **DIRECT SETUP - Bypass Network Issues**

## ✅ **Current Status**
- ✅ **Server Running**: http://localhost:3000
- ✅ **Authentication Working**: Supabase auth endpoint accessible
- ❌ **Network Issue**: Connection to Supabase database having problems

## 🎯 **SOLUTION: Direct Database Setup**

Since your authentication is working but network connection is intermittent, let's set up the database directly through Supabase Dashboard:

### **📋 STEP 1: Setup Database (3 minutes)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login to your account
   - Select project: `mmluzuxcoqyrtenstxq`

2. *      *Go to SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"**

3. **Run This Complete SQL Script**
   Copy and paste this ENTIRE script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE staff_role AS ENUM (
  'Super Admin', 'Administrator', 'HR Manager', 'Department Head',
  'Teacher', 'Support Staff', 'Security', 'Maintenance'
);

CREATE TYPE employment_type AS ENUM (
  'Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'
);

CREATE TYPE attendance_status AS ENUM (
  'present', 'present_late', 'absent', 'on_leave', 'half_day',
  'work_from_home', 'official_duty', 'public_holiday', 'weekend', 'compensatory_off'
);

CREATE TYPE leave_type AS ENUM (
  'sick', 'casual', 'annual', 'maternity', 'paternity',
  'unpaid', 'compassionate', 'study', 'sabbatical'
);

CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Create tables
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staff (
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
  is_active BOOLEAN DEFAULT true,
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE biometric_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  device_info JSONB,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP
);

CREATE TABLE attendance (
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

CREATE TABLE leave_requests (
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

CREATE TABLE audit_logs (
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

-- Create indexes
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_staff_id ON staff(staff_id);
CREATE INDEX idx_attendance_staff_date ON attendance(staff_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view own record" ON staff FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all staff" ON staff FOR SELECT USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('Super Admin', 'Administrator', 'HR Manager'))
);
CREATE POLICY "Admin can modify staff" ON staff FOR ALL USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('Super Admin', 'Administrator', 'HR Manager'))
);

CREATE POLICY "Staff can view own attendance" ON attendance FOR SELECT USING (auth.uid() = staff_id);
CREATE POLICY "Admin can view all attendance" ON attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('Super Admin', 'Administrator', 'HR Manager'))
);
CREATE POLICY "Staff can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Admin can modify attendance" ON attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('Super Admin', 'Administrator', 'HR Manager'))
);

-- Insert default data
INSERT INTO shifts (shift_name, start_time, end_time, grace_period_minutes) 
VALUES ('Regular Shift', '08:00:00', '17:00:00', 15);

INSERT INTO staff (staff_id, first_name, last_name, email, role, department, employment_type, date_joined, shift_id) 
VALUES ('ADMIN001', 'System', 'Administrator', 'admin@timeattendance.edu', 'Super Admin', 'Administration', 'Full-time', CURRENT_DATE, (SELECT id FROM shifts WHERE shift_name = 'Regular Shift'));
```

4. **Click "Run"** and wait for success message

### **👤 STEP 2: Create Admin User (2 minutes)**

1. **Go to Authentication**
   - Click **"Authentication"** → **"Users"** in Supabase dashboard
   - Click **"Add User"** button

2. **Create Admin User**
   ```
   Email: admin@timeattendance.edu
   Password: Admin123!@#
   Email Confirm: ✅ (check this box)
   ```
   - Click **"Create User"**
   - **Copy the User ID** (long string starting with letters/numbers)

### **🔗 STEP 3: Link Admin User (1 minute)**

1. **Go back to SQL Editor**
2. **Run this query** (replace `YOUR_USER_ID` with the copied ID):
   ```sql
   UPDATE staff 
   SET id = 'YOUR_USER_ID'
   WHERE staff_id = 'ADMIN001';
   ```
3. **Click "Run"**

## 🎉 **LOGIN TO YOUR SYSTEM**

### **🌐 Access Your App**
```
http://localhost:3000
```

### **🔐 Admin Login**
```
Email: admin@timeattendance.edu
Password: Admin123!@#
```

## ✅ **What You'll Get**

Once logged in, you'll have access to:
- 📊 **Real-time admin dashboard**
- 👥 **Staff management system**
- 📈 **Live attendance monitoring**
- 📋 **Comprehensive reporting**
- 📝 **Leave management**
- 🔒 **Complete security system**

## 🔧 **If Login Still Fails**

### **Check These:**
1. **Tables Created**: Go to Supabase → Table Editor → Should see all tables
2. **Admin User**: Go to Authentication → Users → Should see admin user
3. **User Linked**: Check staff table has the correct User ID

### **Alternative Test**
If network issues persist, you can:
1. Use the **Preview Mode**: http://localhost:3000/preview
2. See the complete UI and functionality
3. Set up database when network is stable

## 🚀 **Your System Features**

### **✅ Complete Attendance System:**
- 🔒 **Biometric fingerprint authentication**
- 📱 **Mobile-first PWA design**
- ⏰ **Real-time attendance tracking**
- 📊 **Advanced analytics dashboard**
- 🌍 **Geofencing support**
- 📝 **Leave management workflow**
- 🛡️ **Enterprise-grade security**
- 📋 **Complete audit logging**

**Your professional School Staff Biometric Attendance System is ready!** 🎊

---

**Created by Olushola Paul Odunuga** 🚀

**Follow the steps above to complete your setup and start using the real-time admin system!**