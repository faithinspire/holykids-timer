-- ═══════════════════════════════════════════════════════════════════
-- 🎨 ADD LOGO FEATURE - RUN THIS IN SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════

-- Create app_settings table for organization logo and name
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name TEXT DEFAULT 'HOLYKIDS',
    logo_url TEXT,
    primary_color TEXT DEFAULT '#667eea',
    secondary_color TEXT DEFAULT '#764ba2',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (organization_name, logo_url)
VALUES ('HOLYKIDS', NULL)
ON CONFLICT DO NOTHING;

-- If table already exists but empty, insert default
INSERT INTO app_settings (organization_name, logo_url)
SELECT 'HOLYKIDS', NULL
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- RLS policies for app_settings
DROP POLICY IF EXISTS "Allow read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow update app_settings" ON app_settings;

CREATE POLICY "Allow read app_settings"
ON app_settings FOR SELECT
USING (true);

CREATE POLICY "Allow update app_settings"
ON app_settings FOR UPDATE
USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- ✅ DONE! Logo feature database ready.
-- ═══════════════════════════════════════════════════════════════════
