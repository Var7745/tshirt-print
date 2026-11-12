import type { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { hashPassword } from './auth';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    _supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    return _supabase;
  }
  return null;
}

const SAMPLE_AVATARS: string[] = [];

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
const DB_DIR = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');
if (!isServerless && !fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = isServerless ? path.join('/tmp', 'jkempress.db') : path.join(DB_DIR, 'jkempress.db');

function ensureDbFile() {
  if (isServerless && !fs.existsSync(DB_FILE)) {
    const seedFile = path.resolve(process.cwd(), 'data', 'jkempress.db');
    if (fs.existsSync(seedFile)) {
      try {
        fs.copyFileSync(seedFile, DB_FILE);
      } catch (err) {
        console.error('Failed to copy seed database to /tmp:', err);
      }
    }
  }
}

// Singleton database instance
let _db: DatabaseSync | null = null;

function loadDatabaseConstructor(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sqlite = require('node:sqlite');
    return sqlite.DatabaseSync || sqlite.Database;
  } catch (err: any) {
    try {
      const g = globalThis as any;
      const req = typeof g.__non_webpack_require__ !== 'undefined' ? g.__non_webpack_require__ : eval('require');
      const sqlite = req('node:sqlite');
      return sqlite.DatabaseSync || sqlite.Database;
    } catch {
      return null;
    }
  }
}

export function getDb(): DatabaseSync {
  if (!_db) {
    ensureDbFile();
    const DBConstructor = loadDatabaseConstructor();
    if (!DBConstructor) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'FATAL DATABASE ERROR: Native SQLite (node:sqlite) engine could not be initialized in production. ' +
          'Ensure Node.js is >= 22.13.0 or configure Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
        );
      }
      throw new Error('Database initialization failed: SQLite (node:sqlite) is not available in current runtime.');
    }
    _db = new DBConstructor(DB_FILE);
    // Enable WAL mode for high concurrency
    _db.exec('PRAGMA journal_mode = WAL;');
    _db.exec('PRAGMA foreign_keys = ON;');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    -- Admin Users
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

    -- Customers
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
      total_spent REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Orders
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
      price_per_tshirt REAL NOT NULL,
      printing_charges REAL DEFAULT 0,
      customization_charges REAL DEFAULT 0,
      shipping_charges REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      advance_amount REAL DEFAULT 0,
      remaining_amount REAL NOT NULL,
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

    -- Individual T-shirts (Each physical shirt)
    CREATE TABLE IF NOT EXISTS individual_tshirts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      tshirt_number TEXT NOT NULL,
      person_name TEXT NOT NULL,
      jersey_name TEXT,
      roll_number TEXT,
      size TEXT NOT NULL,
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
      created_at TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- Design Files (Per order or per shirt sides)
    CREATE TABLE IF NOT EXISTS design_files (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      tshirt_id TEXT,
      side TEXT NOT NULL, -- front, back, left_sleeve, right_sleeve
      artwork_url TEXT,
      mockup_url TEXT,
      print_width_in REAL DEFAULT 10,
      print_height_in REAL DEFAULT 12,
      dpi INTEGER DEFAULT 300,
      format TEXT DEFAULT 'PNG',
      status TEXT DEFAULT 'pending', -- pending, in_review, approved, rejected, revision_requested
      approval_notes TEXT,
      approved_by TEXT,
      approved_at TEXT,
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Design Versions
    CREATE TABLE IF NOT EXISTS design_versions (
      id TEXT PRIMARY KEY,
      design_file_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      artwork_url TEXT NOT NULL,
      changes_note TEXT,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Production Records
    CREATE TABLE IF NOT EXISTS production_records (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      assigned_staff_id TEXT,
      assigned_staff_name TEXT,
      priority TEXT DEFAULT 'standard', -- standard, urgent, express
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

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      sizes_json TEXT DEFAULT '["XS","S","M","L","XL","XXL","3XL"]',
      colours_json TEXT DEFAULT '["White","Off-White","Black","Navy Blue","Maroon"]',
      fabric TEXT DEFAULT '100% Cotton 220 GSM Bio-Washed',
      sleeve_types_json TEXT DEFAULT '["Half Sleeve","Full Sleeve"]',
      image_url TEXT,
      stock_status TEXT DEFAULT 'in_stock',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Inventory Items
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL, -- tshirt, ink, paper, packaging, marker, shades, other
      name TEXT NOT NULL,
      size TEXT,
      colour TEXT,
      fabric TEXT,
      current_stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 20,
      unit TEXT DEFAULT 'pcs',
      unit_cost REAL DEFAULT 0,
      supplier_name TEXT,
      updated_at TEXT NOT NULL
    );

    -- Inventory Logs
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      change_type TEXT NOT NULL, -- stock_in, stock_out, adjustment, order_allocation
      quantity INTEGER NOT NULL,
      reason TEXT,
      reference_order_id TEXT,
      user_name TEXT,
      created_at TEXT NOT NULL
    );

    -- Payments & Invoices
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL, -- UPI, Bank Transfer, Cash, Card, Gateway
      transaction_ref TEXT,
      status TEXT DEFAULT 'paid', -- paid, pending, failed, refunded
      invoice_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL, -- Material Purchases, Printing Supplies, Shipping, Operations, Other
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      payment_method TEXT,
      vendor_name TEXT,
      receipt_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Shipping Records
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

    -- Coupons & Discounts
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL, -- percentage, fixed
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      start_date TEXT,
      expiry_date TEXT,
      usage_limit INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Enquiries & Support
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      college_name TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new', -- new, contacted, quotation_sent, converted, closed
      follow_up_date TEXT,
      internal_notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Reviews & Feedback
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

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- order, design, payment, production, inventory, enquiry
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Activity Logs
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

    -- Business Settings
    CREATE TABLE IF NOT EXISTS business_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Rate Limits (Persistent rate limiting for auth & public endpoints)
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );
  `);

  runSchemaMigrations(db);
  seedInitialData(db);
  migratePlaintextPasswords(db);
}

function runSchemaMigrations(db: DatabaseSync) {
  try {
    db.exec('ALTER TABLE orders ADD COLUMN idempotency_key TEXT;');
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE customers ADD COLUMN password_hash TEXT;');
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE orders ADD COLUMN invite_token TEXT;');
  } catch {
    // Column already exists
  }

  // Purge any mock/fake/demo data from previous runs
  try {
    db.exec(`
      DELETE FROM individual_tshirts WHERE order_id LIKE 'JK-2026-%' OR order_id LIKE 'demo%';
      DELETE FROM design_files WHERE order_id LIKE 'JK-2026-%' OR order_id LIKE 'demo%';
      DELETE FROM production_records WHERE order_id LIKE 'JK-2026-%' OR order_id LIKE 'demo%';
      DELETE FROM payments WHERE order_id LIKE 'JK-2026-%' OR order_id LIKE 'demo%';
      DELETE FROM shipping_records WHERE order_id LIKE 'JK-2026-%' OR order_id LIKE 'demo%';
      DELETE FROM orders WHERE id LIKE 'JK-2026-%' OR id LIKE 'demo%';
      DELETE FROM customers WHERE id LIKE 'cust_%' OR email LIKE '%@akps.edu.in' OR email LIKE '%@loyola.edu' OR email LIKE '%@srmist.edu.in';
      DELETE FROM enquiries WHERE id LIKE 'enq_%';
      DELETE FROM reviews WHERE id LIKE 'rev_%';
      DELETE FROM notifications WHERE id LIKE 'notif_%';
      DELETE FROM activity_logs WHERE details LIKE '%seed%' OR entity_id LIKE 'JK-2026-%';
      DELETE FROM admin_users WHERE id = 'usr_superadmin' OR email = 'admin@jkempress.com';
    `);
  } catch {
    // Clean-up non-critical
  }
}

function migratePlaintextPasswords(db: DatabaseSync) {
  try {
    const users = db.prepare('SELECT id, password_hash FROM admin_users').all() as Array<{ id: string; password_hash: string }>;
    for (const u of users) {
      if (!u.password_hash.startsWith('scrypt$')) {
        const newHash = hashPassword(u.password_hash);
        db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, u.id);
      }
    }
  } catch (e) {
    console.error('Password migration error:', e);
  }
}

function seedInitialData(db: DatabaseSync) {
  const now = new Date().toISOString();

  // 1. Seed or Update Primary Admin User 'jagan'
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || '24K95A0412';
  const hashedAdminPassword = hashPassword(adminPassword);

  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE id = ? OR email = ? OR name = ?').get('jagan', 'jagan@jkempress.com', 'jagan');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, name, role, phone, avatar_url, status, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'jagan',
      'jagan@jkempress.com',
      hashedAdminPassword,
      'jagan',
      'Super Admin',
      '+91 98490 12345',
      null,
      'active',
      now,
      now
    );
  } else {
    db.prepare(`
      UPDATE admin_users
      SET password_hash = ?, name = 'jagan', role = 'Super Admin', status = 'active'
      WHERE id = 'jagan' OR email = 'jagan@jkempress.com' OR name = 'jagan'
    `).run(hashedAdminPassword);
  }

  // 2. Seed Settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)');
  const defaultSettings: Record<string, string> = {
    company_name: 'JK Empress',
    brand_tagline: 'Make Your Mark — Custom College Apparel & Signature Day Tees',
    contact_phone: '+91 98765 43210',
    whatsapp_number: '+919876543210',
    support_email: 'support@jkempress.com',
    business_address: 'Plot 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081',
    gst_number: '36AAACJ1234F1Z8',
    gst_rate_percent: '5',
    currency_code: 'INR',
    currency_symbol: '₹',
    timezone: 'Asia/Kolkata',
    order_id_prefix: 'JK',
    invoice_prefix: 'INV-JK',
    upi_id: 'jkempress@upi',
    bank_name: 'HDFC Bank Ltd',
    bank_account_no: '50200012345678',
    bank_ifsc: 'HDFC0001234',
    banner_announcement: 'Special College Farewell Discount: Get Free Signature Marker & Photo Frame on Orders Above 30 Shirts!',
    auto_assign_designer: 'true',
    low_stock_notification: 'true',
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    insertSetting.run(key, val, now);
  }

  // 3. Seed Products
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, sku, category, price, description, sizes_json, colours_json, fabric, sleeve_types_json, image_url, stock_status, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProduct.run(
    'prd_sig_day',
    'Signature Day Classic Tee',
    'JK-SIG-001',
    'Signature Day T-shirts',
    130,
    'Premium 220 GSM bio-washed 100% cotton tee with permanent fabric signing marker for classmates to sign and write memories.',
    JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
    JSON.stringify(['White', 'Off-White', 'Pastel Cream']),
    '100% Bio-Washed Cotton (220 GSM)',
    JSON.stringify(['Half Sleeve']),
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    'in_stock',
    1,
    now
  );

  insertProduct.run(
    'prd_salina_pack',
    'Salina Keepsake Farewell Pack',
    'JK-SAL-002',
    'Farewell T-shirts',
    150,
    'Signature Day T-shirt + Fabric Signing Marker + Stylish Sunglasses (Shades) for epic batch group photo sessions.',
    JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
    JSON.stringify(['White', 'Off-White', 'Black', 'Navy Blue']),
    '100% Bio-Washed Cotton (220 GSM)',
    JSON.stringify(['Half Sleeve', 'Full Sleeve']),
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=80',
    'in_stock',
    1,
    now
  );

  insertProduct.run(
    'prd_top_pack',
    'Top Memorabilia Deluxe Box',
    'JK-TOP-003',
    'Customized Photo T-shirts',
    200,
    'Luxury college farewell box: T-shirt + A4 Framed Batch Photo Mosaic + Permanent Marker + Shades.',
    JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
    JSON.stringify(['White', 'Off-White', 'Charcoal', 'Navy Blue', 'Maroon']),
    '100% Combed Cotton (240 GSM Luxury)',
    JSON.stringify(['Half Sleeve', 'Full Sleeve']),
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=80',
    'in_stock',
    1,
    now
  );

  insertProduct.run(
    'prd_fest_tee',
    'College Fest & Department Tee',
    'JK-FEST-004',
    'College Event T-shirts',
    160,
    'Durable vibrant department t-shirts with front college logo and back custom artwork for symposiums, sports days, and fests.',
    JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
    JSON.stringify(['Royal Blue', 'Black', 'Golden Yellow', 'Emerald Green', 'Red']),
    '100% Super-Combed Cotton (220 GSM)',
    JSON.stringify(['Half Sleeve']),
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&auto=format&fit=crop&q=80',
    'in_stock',
    1,
    now
  );

  // 4. Seed Inventory
  const insertInventory = db.prepare(`
    INSERT INTO inventory_items (id, item_type, name, size, colour, fabric, current_stock, low_stock_threshold, unit, unit_cost, supplier_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialInventory = [
    ['inv_wh_xs', 'tshirt', 'Plain White Blank Tee (220 GSM)', 'XS', 'White', '100% Cotton', 85, 25, 'pcs', 75, 'Tirupur Cotton Mills'],
    ['inv_wh_s', 'tshirt', 'Plain White Blank Tee (220 GSM)', 'S', 'White', '100% Cotton', 240, 50, 'pcs', 75, 'Tirupur Cotton Mills'],
    ['inv_wh_m', 'tshirt', 'Plain White Blank Tee (220 GSM)', 'M', 'White', '100% Cotton', 450, 75, 'pcs', 78, 'Tirupur Cotton Mills'],
    ['inv_wh_l', 'tshirt', 'Plain White Blank Tee (220 GSM)', 'L', 'White', '100% Cotton', 420, 75, 'pcs', 78, 'Tirupur Cotton Mills'],
    ['inv_wh_xl', 'tshirt', 'Plain White Blank Tee (220 GSM)', 'XL', 'White', '100% Cotton', 280, 50, 'pcs', 82, 'Tirupur Cotton Mills'],
    ['inv_wh_xxl', 'tshirt', 'Plain White Blank Tee (220 GSM)', 'XXL', 'White', '100% Cotton', 110, 30, 'pcs', 88, 'Tirupur Cotton Mills'],
    ['inv_wh_3xl', 'tshirt', 'Plain White Blank Tee (220 GSM)', '3XL', 'White', '100% Cotton', 45, 15, 'pcs', 92, 'Tirupur Cotton Mills'],
    ['inv_blk_m', 'tshirt', 'Plain Black Blank Tee (220 GSM)', 'M', 'Black', '100% Cotton', 180, 40, 'pcs', 82, 'Tirupur Cotton Mills'],
    ['inv_blk_l', 'tshirt', 'Plain Black Blank Tee (220 GSM)', 'L', 'Black', '100% Cotton', 210, 40, 'pcs', 82, 'Tirupur Cotton Mills'],
    ['inv_marker', 'marker', 'Permanent Textile Fabric Markers (Black)', null, 'Black', null, 680, 100, 'pcs', 12, 'Camlin Art & Industrial'],
    ['inv_shades', 'shades', 'Farewell Retro Sunglasses (Black/UV400)', null, 'Black', null, 420, 80, 'pcs', 22, 'Apex Optical Imports'],
    ['inv_frames', 'packaging', 'A4 Woodgrain Acrylic Photo Frames', null, 'Teak Wood', null, 150, 30, 'pcs', 45, 'Heritage Framing Studio'],
    ['inv_dtg_ink_cmyk', 'ink', 'DuPont Artistri DTG Pigment Ink CMYK (1L)', null, 'CMYK', null, 18, 5, 'liters', 3400, 'ColorJet Technologies'],
    ['inv_dtg_ink_wht', 'ink', 'DuPont Artistri Ultra White DTG Ink (1L)', null, 'White', null, 24, 6, 'liters', 4200, 'ColorJet Technologies'],
    ['inv_box_l', 'packaging', 'Eco-friendly Brown Kraft Shipping Boxes', null, 'Kraft Brown', null, 350, 50, 'pcs', 18, 'Sri Packaging Ltd'],
  ];

  for (const item of initialInventory) {
    insertInventory.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], item[8], item[9], item[10], now);
  }

  // 5. Seed Coupons (Optional initial discount coupons)
  const insertCoupon = db.prepare(`
    INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, start_date, expiry_date, usage_limit, used_count, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCoupon.run('cpn_farewell10', 'FAREWELL10', 'percentage', 10, 5000, 1500, '2026-01-01', '2027-12-31', 500, 0, 1, now);
  insertCoupon.run('cpn_bulk1000', 'BULK1000', 'fixed', 1000, 10000, 1000, '2026-01-01', '2027-12-31', 200, 0, 1, now);
}

// -----------------------------------------------------------------------------
// Database Query Helpers
// -----------------------------------------------------------------------------

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const db = getDb();
  const row = db.prepare(sql).get(...params);
  return (row as T) || null;
}

export function execute(sql: string, params: any[] = []): void {
  const db = getDb();
  db.prepare(sql).run(...params);
}

export function logActivity(user: string, role: string, action: string, type: string, id: string | null, details: string, ip = '127.0.0.1') {
  const db = getDb();
  const logId = 'act_' + Math.random().toString(36).substring(2, 10);
  db.prepare(`
    INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(logId, user, role, action, type, id, details, ip, new Date().toISOString());
}

/**
 * Shared persistent rate limit tracker using SQLite rate_limits table.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    // Clean up expired entries periodically
    db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now);

    const record = db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as { count: number; reset_at: number } | undefined;

    if (!record) {
      const resetAt = now + windowSeconds;
      db.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)').run(key, resetAt);
      return { allowed: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds };
    }

    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(1, record.reset_at - now),
      };
    }

    db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key);
    return {
      allowed: true,
      remaining: maxRequests - (record.count + 1),
      resetInSeconds: Math.max(1, record.reset_at - now),
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open in case of unexpected DB error
    return { allowed: true, remaining: 1, resetInSeconds: windowSeconds };
  }
}
