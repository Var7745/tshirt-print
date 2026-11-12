-- ==============================================================================
-- JK EMPRESS — Production PostgreSQL Schema (Supabase)
-- Version: 2.2.0 (Full 1-to-1 parity with Application Data Layer)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 2. Customers CRM & Batch Coordinators
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  password_hash TEXT,
  college_name TEXT,
  department TEXT,
  batch TEXT,
  billing_address TEXT,
  delivery_address TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_college ON customers(college_name);

-- 3. Orders (Batch & Individual Custom Apparel)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  college_name TEXT NOT NULL,
  department TEXT,
  batch TEXT,
  billing_address TEXT,
  delivery_address TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_date TEXT,
  delivery_required_date TEXT,
  participants_count INTEGER NOT NULL,
  tshirts_count INTEGER NOT NULL,
  collage_shape TEXT DEFAULT 'honeycomb',
  pack_name TEXT DEFAULT 'salina',
  price_per_tshirt NUMERIC NOT NULL,
  printing_charges NUMERIC DEFAULT 0,
  customization_charges NUMERIC DEFAULT 0,
  shipping_charges NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  advance_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  production_status TEXT DEFAULT 'confirmed',
  delivery_status TEXT DEFAULT 'packing_pending',
  special_instructions TEXT,
  back_template TEXT DEFAULT 'jersey',
  idempotency_key TEXT,
  invite_token TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(production_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_invite_token ON orders(invite_token);

-- 4. Individual T-Shirts (Standardized Sizes: S to XXXL, No XS)
CREATE TABLE IF NOT EXISTS individual_tshirts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  tshirt_number TEXT NOT NULL,
  person_name TEXT NOT NULL,
  jersey_name TEXT,
  roll_number TEXT,
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL')),
  colour TEXT DEFAULT 'White',
  fabric TEXT DEFAULT '100% Bio-Washed Cotton (220 GSM)',
  sleeve_type TEXT DEFAULT 'Half Sleeve',
  main_photo_url TEXT,
  additional_photos TEXT DEFAULT '[]',
  custom_text TEXT,
  signature_image_url TEXT,
  special_instructions TEXT,
  print_front INTEGER DEFAULT 1,
  print_back INTEGER DEFAULT 1,
  print_left_sleeve INTEGER DEFAULT 0,
  print_right_sleeve INTEGER DEFAULT 0,
  unique_photos_count INTEGER DEFAULT 1,
  required_print_copies INTEGER DEFAULT 1,
  production_status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_individual_tshirts_order ON individual_tshirts(order_id);
CREATE INDEX IF NOT EXISTS idx_individual_tshirts_roll ON individual_tshirts(order_id, roll_number);

-- 5. Design Files
CREATE TABLE IF NOT EXISTS design_files (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  tshirt_id TEXT,
  side TEXT NOT NULL,
  artwork_url TEXT,
  mockup_url TEXT,
  print_width_in NUMERIC DEFAULT 10,
  print_height_in NUMERIC DEFAULT 12,
  dpi INTEGER DEFAULT 300,
  format TEXT DEFAULT 'PNG',
  status TEXT DEFAULT 'pending',
  approval_notes TEXT,
  approved_by TEXT,
  approved_at TEXT,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Design Versions
CREATE TABLE IF NOT EXISTS design_versions (
  id TEXT PRIMARY KEY,
  design_file_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  artwork_url TEXT NOT NULL,
  changes_note TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 7. Production Records
CREATE TABLE IF NOT EXISTS production_records (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  assigned_staff_id TEXT,
  assigned_staff_name TEXT,
  priority TEXT DEFAULT 'standard',
  stage TEXT DEFAULT 'order_confirmed',
  start_date TEXT,
  expected_date TEXT,
  completed_date TEXT,
  tshirts_completed INTEGER DEFAULT 0,
  tshirts_pending INTEGER DEFAULT 0,
  defective_count INTEGER DEFAULT 0,
  reprint_requests INTEGER DEFAULT 0,
  notes TEXT,
  checklist_json TEXT DEFAULT '[]',
  updated_at TEXT NOT NULL
);

-- 8. Products Catalog
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  sizes_json TEXT DEFAULT '["S","M","L","XL","2XL","XXL","3XL","XXXL"]',
  colours_json TEXT DEFAULT '["White","Off-White","Black","Navy Blue","Maroon"]',
  fabric TEXT DEFAULT '100% Cotton 220 GSM Bio-Washed',
  sleeve_types_json TEXT DEFAULT '["Half Sleeve","Full Sleeve"]',
  image_url TEXT,
  stock_status TEXT DEFAULT 'in_stock',
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 9. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  name TEXT NOT NULL,
  size TEXT,
  colour TEXT,
  fabric TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 20,
  unit TEXT DEFAULT 'pcs',
  unit_cost NUMERIC DEFAULT 0,
  supplier_name TEXT,
  updated_at TEXT NOT NULL
);

-- 10. Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  change_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_order_id TEXT,
  user_name TEXT,
  created_at TEXT NOT NULL
);

-- 11. Payments & Invoices
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT,
  status TEXT DEFAULT 'paid',
  invoice_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 12. Operating Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date TEXT NOT NULL,
  payment_method TEXT,
  vendor_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 13. Logistics / Shipping Records
CREATE TABLE IF NOT EXISTS shipping_records (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  packages_count INTEGER DEFAULT 1,
  total_tshirts INTEGER NOT NULL,
  courier_name TEXT,
  tracking_number TEXT,
  shipment_date TEXT,
  expected_delivery_date TEXT,
  actual_delivery_date TEXT,
  status TEXT DEFAULT 'packing_pending',
  delivery_notes TEXT,
  updated_at TEXT NOT NULL
);

-- 14. Coupons & Discounts
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC DEFAULT 0,
  start_date TEXT,
  expiry_date TEXT,
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 15. Inbound Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  college_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  follow_up_date TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL
);

-- 16. Customer Reviews & Testimonials
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  college_name TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  order_id TEXT,
  is_approved INTEGER DEFAULT 1,
  is_published_testimonial INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 17. System Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 18. Security & Operational Audit Log
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

-- 19. Business Settings & Key-Value Configuration
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 20. Distributed Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at BIGINT NOT NULL
);

-- Row-Level Security (RLS) Enablement
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

-- Service Role Full Access Policies
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

-- Public Read Policies
DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (is_active = 1);

DROP POLICY IF EXISTS "Public Read Reviews" ON reviews;
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (is_approved = 1);
