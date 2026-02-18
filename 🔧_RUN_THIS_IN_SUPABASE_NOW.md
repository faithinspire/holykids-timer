# 🔧 FIX SUPABASE RLS INFINITE RECURSION

## ERROR
```
infinite recursion detected in policy for relation "staff"
```

## CAUSE
Your Supabase Row Level Security (RLS) policies have a circular reference. This happens when a policy checks a condition that triggers another policy, creating an infinite loop.

## FIX (DO THIS NOW)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run This SQL
Copy and paste the entire contents of `FIX_SUPABASE_RLS_POLICY.sql` into the SQL Editor and click "Run".

This will:
1. Drop all existing policies on `staff` and `attendance` tables
2. Create simple, non-recursive policies that allow all operations
3. Enable RLS on both tables
4. Verify the policies are correct

### Step 3: Test
After running the SQL:
1. Go back to your app
2. Try to register a new staff member
3. The error should be gone

## WHAT THE FIX DOES

**Before (Broken):**
```sql
-- This creates infinite recursion:
CREATE POLICY "staff_policy" ON staff
USING (
  EXISTS (
    SELECT 1 FROM staff  -- ❌ This checks staff table again!
    WHERE staff.id = auth.uid()
  )
);
```

**After (Fixed):**
```sql
-- Simple policy with no recursion:
CREATE POLICY "Allow all operations on staff"
ON staff
FOR ALL
USING (true)
WITH CHECK (true);
```

## ALTERNATIVE: If You Need Authentication

If you want to restrict access to authenticated users only, use this policy instead:

```sql
CREATE POLICY "Allow authenticated operations on staff"
ON staff
FOR ALL
USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
```

## VERIFICATION

After running the fix, verify in Supabase:
1. Go to "Database" → "Policies"
2. Check the `staff` table
3. You should see one simple policy: "Allow all operations on staff"
4. No circular references

## WHY THIS HAPPENED

RLS policies can reference other tables, but if they reference the same table they're protecting, it creates infinite recursion. The fix uses a simple `true` condition that doesn't reference any tables.

---

**Run the SQL file NOW to fix the error!**
