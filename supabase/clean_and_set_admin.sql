-- ==============================================================================
-- JK EMPRESS — Production Supabase Cleanup & Admin Setup
-- 1. Cleans all fake/demo data (orders, mock customers, shirts, reviews, enquiries)
-- 2. Sets Super Admin:
--    Username: jagan (or jagan@jkempress.com)
--    Password: 24K95A0412 (hashed with scrypt)
-- ==============================================================================

-- 1. Remove all mock / demo data
DELETE FROM individual_tshirts;
DELETE FROM design_files;
DELETE FROM production_records;
DELETE FROM payments;
DELETE FROM shipping_records;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM enquiries;
DELETE FROM reviews;
DELETE FROM notifications;
DELETE FROM activity_logs;

-- 2. Remove any previous admin users
DELETE FROM admin_users;

-- 3. Insert new Super Admin 'jagan' with password '24K95A0412'
INSERT INTO admin_users (
  id,
  email,
  password_hash,
  name,
  role,
  phone,
  avatar_url,
  status,
  created_at,
  last_login_at
) VALUES (
  'jagan',
  'jagan@jkempress.com',
  'scrypt$16384$8$1$f6c22e667145ffc72e6b2eb80ba2334d$3682e1993eef0b27a166771cc2532c19f87e2248f38194bde4f9be815a73e2d1d70bada1caf9bfe2231d66c9074dc745415f9f3f01ab496b713355462974453d',
  'jagan',
  'Super Admin',
  '+91 98490 12345',
  NULL,
  'active',
  NOW()::TEXT,
  NOW()::TEXT
);

-- 4. Enable Row Level Security (RLS) on all tables (Supabase Best Practice)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_tshirts ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 5. Service Role Full Access Policies
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service Role Full Access %I" ON %I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Service Role Full Access %I" ON %I FOR ALL USING (auth.role() = ''service_role'');', tbl, tbl);
  END LOOP;
END $$;
