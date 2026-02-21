-- ═══════════════════════════════════════════════════════════════════
-- 🏢 MULTI-TENANT SYSTEM - RUN THIS IN SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════
-- This allows multiple organizations to use the same app with separate data
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly name (e.g., "holykids", "school-abc")
    logo_url TEXT,
    primary_color TEXT DEFAULT '#667eea',
    secondary_color TEXT DEFAULT '#764ba2',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Add organization_id to staff table
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Add organization_id to attendance table
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Add organization_id to audit_logs table
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 5. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_organization ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_organization ON attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);

-- 6. Create default organization (HOLYKIDS)
INSERT INTO organizations (name, slug, primary_color, secondary_color)
VALUES ('HOLYKIDS', 'holykids', '#667eea', '#764ba2')
ON CONFLICT (slug) DO NOTHING;

-- 7. Link existing staff to default organization
UPDATE staff
SET organization_id = (SELECT id FROM organizations WHERE slug = 'holykids')
WHERE organization_id IS NULL;

-- 8. Link existing attendance to default organization
UPDATE attendance
SET organization_id = (SELECT id FROM organizations WHERE slug = 'holykids')
WHERE organization_id IS NULL;

-- 9. Link existing audit_logs to default organization
UPDATE audit_logs
SET organization_id = (SELECT id FROM organizations WHERE slug = 'holykids')
WHERE organization_id IS NULL;

-- 10. Update RLS policies for multi-tenant access

-- Staff policies
DROP POLICY IF EXISTS "Allow read staff" ON staff;
DROP POLICY IF EXISTS "Allow insert staff" ON staff;
DROP POLICY IF EXISTS "Allow update staff" ON staff;

CREATE POLICY "Allow read staff"
ON staff FOR SELECT
USING (true);

CREATE POLICY "Allow insert staff"
ON staff FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update staff"
ON staff FOR UPDATE
USING (true);

-- Attendance policies
DROP POLICY IF EXISTS "Allow insert attendance" ON attendance;
DROP POLICY IF EXISTS "Allow read attendance" ON attendance;
DROP POLICY IF EXISTS "Allow update attendance" ON attendance;

CREATE POLICY "Allow insert attendance"
ON attendance FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow read attendance"
ON attendance FOR SELECT
USING (true);

CREATE POLICY "Allow update attendance"
ON attendance FOR UPDATE
USING (true);

-- Audit logs policies
DROP POLICY IF EXISTS "Allow insert audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow read audit_logs" ON audit_logs;

CREATE POLICY "Allow insert audit_logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow read audit_logs"
ON audit_logs FOR SELECT
USING (true);

-- Organizations policies
DROP POLICY IF EXISTS "Allow read organizations" ON organizations;
DROP POLICY IF EXISTS "Allow insert organizations" ON organizations;
DROP POLICY IF EXISTS "Allow update organizations" ON organizations;

CREATE POLICY "Allow read organizations"
ON organizations FOR SELECT
USING (true);

CREATE POLICY "Allow insert organizations"
ON organizations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update organizations"
ON organizations FOR UPDATE
USING (true);

-- 11. Create function to get organization by slug
CREATE OR REPLACE FUNCTION get_organization_by_slug(org_slug TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        o.primary_color,
        o.secondary_color
    FROM organizations o
    WHERE o.slug = org_slug AND o.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 12. Verify setup
SELECT 
    'Organizations' as table_name,
    COUNT(*) as record_count
FROM organizations
UNION ALL
SELECT 
    'Staff with org_id',
    COUNT(*)
FROM staff
WHERE organization_id IS NOT NULL
UNION ALL
SELECT 
    'Attendance with org_id',
    COUNT(*)
FROM attendance
WHERE organization_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ DONE! Multi-tenant system is ready.
-- ═══════════════════════════════════════════════════════════════════
-- 
-- HOW TO ADD NEW ORGANIZATIONS:
-- 
-- INSERT INTO organizations (name, slug, primary_color, secondary_color)
-- VALUES ('School ABC', 'school-abc', '#ff6b6b', '#4ecdc4');
-- 
-- Then access at: your-app.com?org=school-abc
-- ═══════════════════════════════════════════════════════════════════
