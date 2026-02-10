# 🔐 Admin Setup - Real-Time System

## 🚀 **Quick Setup (5 Minutes)**

### **Step 1: Setup Database Tables (2 minutes)**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `mmluzuxcoqyrtenstxq`

2. **Run Database Schema**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"**
   - Copy the SQL from file: `supabase/final-setup.sql` and paste it
   - This file is safe to run multiple times!

3. **Click "Run"** and wait for "Success" message

### **Step 2: Create Admin User (2 minutes)**

1. **Go to Authentication**
   - Click **"Authentication"** → **"Users"** in Supabase dashboard
   - Click **"Add User"** button

2. **Create Admin User**
   - **Email**: `admin@timeattendance.edu`
   - **Password**: `Admin123!@#`
   - **Email Confirm**: ✅ Check this box
   - Click **"Create User"**

3. **Copy User ID**
   - After creation, **copy the User ID** (looks like: `12345678-1234-1234-1234-123456789012`)

### **Step 3: Link Admin User (1 minute)**

1. **Go back to SQL Editor**
2. **Run this query** (replace `YOUR_USER_ID` with the copied ID):

   UPDATE staff 
   SET id = 'YOUR_USER_ID'
   WHERE staff_id = 'ADMIN001';

3. **Click "Run"**

### **Step 4: Test Login**
1. Go to `http://localhost:3000/auth/login`
2. Login with:
   - **Email**: `admin@timeattendance.edu`
   - **Password**: `Admin123!@#`

## 🎉 **Ready to Login!**

### **🌐 Access Your System:**
http://localhost:3000

### **🔐 Admin Login Credentials:**
- **Email**: `admin@timeattendance.edu`
- **Password**: `Admin123!@#`

### **✅ What You'll Get:**
- ✅ **Real-time admin dashboard**
- ✅ **Live attendance monitoring**
- ✅ **Staff management**
- ✅ **Complete reporting system**
- ✅ **Leave management**
- ✅ **Audit logging**

### **🚨 Admin-Only Access:**
- Only users with `Super Admin`, `Administrator`, or `HR Manager` roles can access admin features
- Staff members will be redirected to staff dashboard
- Complete role-based access control

## 🔧 **Troubleshooting**

### **If Login Fails:**
1. Check that you ran the complete SQL schema
2. Verify the admin user was created in Authentication
3. Ensure the User ID was updated in the staff table
4. Check browser console for errors

### **If Tables Don't Exist:**
- Make sure you copied and ran the ENTIRE SQL script from `supabase/final-setup.sql`
- Check Supabase Dashboard → Table Editor to see if tables were created

### **If Access Denied:**
- Verify the staff record has role = 'Super Admin'
- Check that the User ID matches between Authentication and staff table

## 🎯 **Next Steps**

Once logged in as admin, you can:
1. **Add more staff members** via Authentication → Users
2. **Create staff records** in the staff table
3. **Monitor real-time attendance**
4. **Generate reports**
5. **Manage leave requests**

**Your real-time School Staff Biometric Attendance System is ready!** 🚀

---

**IMPORTANT: Use the SQL from `supabase/final-setup.sql` file - it's safe to run multiple times!**
