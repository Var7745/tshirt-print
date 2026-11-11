import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './auth';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

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

export function getDb(): DatabaseSync {
  if (!_db) {
    ensureDbFile();
    _db = new DatabaseSync(DB_FILE);
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

  seedInitialData(db);
  migratePlaintextPasswords(db);
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
  // Check if admin already exists
  const countRow = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (countRow && countRow.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  // 1. Seed Primary Admin User
  const insertAdmin = db.prepare(`
    INSERT INTO admin_users (id, email, password_hash, name, role, phone, avatar_url, status, created_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAdmin.run(
    'usr_superadmin',
    'admin@jkempress.com',
    hashPassword('12345678'), // Master Admin credentials hashed with scrypt
    'JK Empress Admin',
    'Admin',
    '+91 98490 12345',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'active',
    now,
    now
  );

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

  // 5. Seed Customers & Bulk Orders
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, phone, whatsapp, email, college_name, department, batch, billing_address, delivery_address, total_orders, total_spent, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_id, customer_name, phone, whatsapp, email, college_name, department, batch,
      billing_address, delivery_address, event_name, event_category, event_date, delivery_required_date,
      participants_count, tshirts_count, collage_shape, pack_name, price_per_tshirt,
      printing_charges, customization_charges, shipping_charges, discount_amount, gst_amount,
      total_amount, advance_amount, remaining_amount, payment_status, production_status,
      delivery_status, special_instructions, back_template, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertShirt = db.prepare(`
    INSERT INTO individual_tshirts (
      id, order_id, tshirt_number, person_name, jersey_name, roll_number, size,
      colour, fabric, sleeve_type, main_photo_url, additional_photos, custom_text,
      signature_image_url, special_instructions, print_front, print_back, print_left_sleeve, print_right_sleeve,
      unique_photos_count, required_print_copies, production_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDesign = db.prepare(`
    INSERT INTO design_files (
      id, order_id, tshirt_id, side, artwork_url, mockup_url, print_width_in, print_height_in, dpi, format, status, approval_notes, approved_by, approved_at, version, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProduction = db.prepare(`
    INSERT INTO production_records (
      id, order_id, assigned_staff_id, assigned_staff_name, priority, stage, start_date, expected_date, completed_date, tshirts_completed, tshirts_pending, defective_count, reprint_requests, notes, checklist_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (
      id, order_id, amount, payment_date, payment_method, transaction_ref, status, invoice_number, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertShipping = db.prepare(`
    INSERT INTO shipping_records (
      id, order_id, customer_name, delivery_address, packages_count, total_tshirts, courier_name, tracking_number, shipment_date, expected_delivery_date, actual_delivery_date, status, delivery_notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // --- ORDER 1: JK-2026-0001 (Signature Day, 60 shirts, In Production) ---
  insertCustomer.run(
    'cust_001',
    'Praveen Kumar',
    '+91 98765 01001',
    '+91 98765 01001',
    'praveen.ece@akps.edu.in',
    'A K P S GOVT JR College',
    'ECE - Section B',
    '2023 - 2027',
    'ECE Dept, A K P S College Campus, Tanuku, West Godavari, Andhra Pradesh 534211',
    'ECE Dept, A K P S College Campus, Tanuku, West Godavari, Andhra Pradesh 534211',
    1,
    9000,
    'Class Representative. Requested delivery 2 days before farewell.',
    '2026-10-01T10:00:00Z'
  );

  insertOrder.run(
    'JK-2026-0001',
    'cust_001',
    'Praveen Kumar',
    '+91 98765 01001',
    '+91 98765 01001',
    'praveen.ece@akps.edu.in',
    'A K P S GOVT JR College',
    'ECE - Section B',
    '2023 - 2027',
    'ECE Dept, A K P S College Campus, Tanuku, West Godavari, AP 534211',
    'ECE Dept, A K P S College Campus, Tanuku, West Godavari, AP 534211',
    'Signature Day 2027',
    'Signature Day',
    '2027-03-20',
    '2027-03-15',
    60,
    60,
    'honeycomb',
    'salina',
    150,
    0,
    0,
    0,
    0,
    450,
    9450,
    5000,
    4450,
    'partially_paid',
    'printing_in_progress',
    'packing_pending',
    'Front Honeycomb rosette print with all 60 classmates. Pack includes Black Fabric Markers & Shades.',
    'jersey',
    '2026-10-01T10:15:00Z',
    now
  );

  // 60 Individual T-shirts for JK-2026-0001
  const sizesDistribution = ['S', 'M', 'M', 'L', 'L', 'L', 'XL', 'XL', 'XXL', 'M'];
  const sampleNames = [
    ['Neha Sharma', 'NEHA', '021'],
    ['Rahul Verma', 'RAHUL', '045'],
    ['Ananya Iyer', 'ANANYA', '012'],
    ['Karthik Raja', 'KARTHIK', '088'],
    ['Pooja Reddy', 'POOJA', '034'],
    ['Aditya Sen', 'ADITYA', '076'],
    ['Divya Nair', 'DIVYA', '019'],
    ['Siddharth Patel', 'SID', '052'],
    ['Sneha Kulkarni', 'SNEHA', '063'],
    ['Vikram Malhotra', 'VIKRAM', '099'],
    ['Deepika Das', 'DEEPIKA', '015'],
    ['Rohan Gupta', 'ROHAN', '071'],
    ['Meera Joshi', 'MEERA', '029'],
    ['Harish Chander', 'HARISH', '084'],
    ['Swati Mishra', 'SWATI', '038'],
    ['Gautam Menon', 'GAUTAM', '057'],
    ['Shreya Banerjee', 'SHREYA', '008'],
    ['Arjun Deshmukh', 'ARJUN', '092'],
    ['Tanvi Bhat', 'TANVI', '041'],
    ['Naveen Kumar', 'NAVEEN', '066'],
  ];

  for (let i = 1; i <= 60; i++) {
    const padded = String(i).padStart(3, '0');
    const shirtId = `JK-2026-0001-${padded}`;
    const nameItem = sampleNames[(i - 1) % sampleNames.length];
    const name = `${nameItem[0]}${i > 20 ? ' (' + i + ')' : ''}`;
    const jersey = `${nameItem[1]}${i > 20 ? i : ''}`;
    const roll = String(parseInt(nameItem[2]) + (i > 20 ? i : 0)).padStart(3, '0');
    const size = sizesDistribution[(i - 1) % sizesDistribution.length];
    const avatar = SAMPLE_AVATARS[(i - 1) % SAMPLE_AVATARS.length];

    insertShirt.run(
      shirtId,
      'JK-2026-0001',
      padded,
      name,
      jersey,
      roll,
      size,
      'White',
      '100% Bio-Washed Cotton (220 GSM)',
      'Half Sleeve',
      avatar,
      JSON.stringify([avatar]),
      `ECE - B Batch of 2027`,
      null,
      'Ensure high resolution on name and number back print.',
      1, // front
      1, // back
      0, // left sleeve
      0, // right sleeve
      60,
      1,
      i <= 42 ? 'completed' : 'printing',
      '2026-10-01T10:30:00Z'
    );

    // Front & Back Design files for key shirts
    if (i <= 5) {
      insertDesign.run(
        `des_001_${padded}_front`,
        'JK-2026-0001',
        shirtId,
        'front',
        '/mockups/front_honeycomb.png',
        '/mockups/tshirt_front_preview.png',
        10.5,
        13.0,
        300,
        'PNG',
        'approved',
        'Honeycomb rosette centered with student avatar.',
        'Anjali Mehta',
        '2026-10-03T14:00:00Z',
        1,
        '2026-10-02T10:00:00Z',
        now
      );

      insertDesign.run(
        `des_001_${padded}_back`,
        'JK-2026-0001',
        shirtId,
        'back',
        '/mockups/back_jersey.png',
        '/mockups/tshirt_back_preview.png',
        11.0,
        14.0,
        300,
        'PNG',
        'approved',
        `Jersey Name: ${jersey}, Roll: ${roll}`,
        'Anjali Mehta',
        '2026-10-03T14:00:00Z',
        1,
        '2026-10-02T10:00:00Z',
        now
      );
    }
  }

  // Order 1 Production Record
  insertProduction.run(
    'prod_001',
    'JK-2026-0001',
    'usr_production',
    'Suresh Goud',
    'urgent',
    'printing_in_progress',
    '2026-10-04',
    '2026-10-14',
    null,
    42,
    18,
    1,
    0,
    '42 of 60 t-shirts printed and checked. 18 shirts pending on Printer 2. High print clarity on white cotton.',
    JSON.stringify([
      { task: 'Verify fabric quantity and size breakdown (60 pcs)', done: true },
      { task: 'Pre-treatment applied to cotton blanks', done: true },
      { task: 'Front Honeycomb artwork DTG print test approved', done: true },
      { task: 'Back Jersey name & number print in progress', done: true },
      { task: 'Heat press curing at 165°C for 90 seconds', done: false },
      { task: 'Quality inspection & packaging with markers and shades', done: false }
    ]),
    now
  );

  // Order 1 Payment
  insertPayment.run(
    'pay_001',
    'JK-2026-0001',
    5000,
    '2026-10-01',
    'UPI',
    'UPI/26100112345/HDFC',
    'paid',
    'INV-JK-2026-0001',
    'Advance 50%+ payment received via PhonePe UPI',
    '2026-10-01T10:20:00Z'
  );

  // Order 1 Shipping placeholder
  insertShipping.run(
    'ship_001',
    'JK-2026-0001',
    'Praveen Kumar',
    'ECE Dept, A K P S College Campus, Tanuku, West Godavari, AP 534211',
    2,
    60,
    'BlueDart Express',
    'BD982736451IN',
    null,
    '2026-10-16',
    null,
    'packing_pending',
    'Two heavy carton boxes containing 30 shirts each + 60 markers + 60 retro sunglasses.',
    now
  );

  // --- ORDER 2: JK-2026-0002 (IIT Bombay Farewell, 45 shirts, Ready for Delivery) ---
  insertCustomer.run(
    'cust_002',
    'Rohan Kulkarni',
    '+91 99887 76655',
    '+91 99887 76655',
    'rohan.k@iitb.ac.in',
    'IIT Bombay - Indian Institute of Technology',
    'Computer Science & Engineering',
    'Class of 2026',
    'Hostel 14, Room 302, IIT Bombay, Powai, Mumbai, Maharashtra 400076',
    'Hostel 14, Room 302, IIT Bombay, Powai, Mumbai, Maharashtra 400076',
    1,
    9000,
    'Prefers Top Memorabilia Deluxe Box with A4 Framed Photo.',
    '2026-10-03T11:00:00Z'
  );

  insertOrder.run(
    'JK-2026-0002',
    'cust_002',
    'Rohan Kulkarni',
    '+91 99887 76655',
    '+91 99887 76655',
    'rohan.k@iitb.ac.in',
    'IIT Bombay - Indian Institute of Technology',
    'Computer Science & Engineering',
    'Class of 2026',
    'Hostel 14, Room 302, IIT Bombay, Powai, Mumbai 400076',
    'Hostel 14, Room 302, IIT Bombay, Powai, Mumbai 400076',
    'CSE Farewell 2026',
    'Farewell',
    '2026-11-25',
    '2026-11-18',
    45,
    45,
    'square',
    'top',
    200,
    0,
    0,
    0,
    0,
    450,
    9450,
    9450,
    0,
    'paid',
    'ready_for_dispatch',
    'ready_for_dispatch',
    'Square photo mosaic with all 45 seniors. A4 wooden frames included for every student.',
    'varsity',
    '2026-10-03T11:15:00Z',
    now
  );

  for (let i = 1; i <= 45; i++) {
    const padded = String(i).padStart(3, '0');
    insertShirt.run(
      `JK-2026-0002-${padded}`,
      'JK-2026-0002',
      padded,
      `Student ${padded} (CSE)`,
      `ROBOT_${i}`,
      `CS${100 + i}`,
      i % 2 === 0 ? 'L' : 'M',
      'White',
      '100% Cotton 220 GSM Bio-Washed',
      'Half Sleeve',
      SAMPLE_AVATARS[i % SAMPLE_AVATARS.length],
      JSON.stringify([SAMPLE_AVATARS[i % SAMPLE_AVATARS.length]]),
      'IIT Bombay CSE Batch 2026',
      null,
      'Checked and packed.',
      1,
      1,
      0,
      0,
      45,
      1,
      'completed',
      '2026-10-03T11:30:00Z'
    );
  }

  insertProduction.run(
    'prod_002',
    'JK-2026-0002',
    'usr_production',
    'Suresh Goud',
    'standard',
    'packing_completed',
    '2026-10-05',
    '2026-10-12',
    '2026-10-11',
    45,
    0,
    0,
    0,
    'All 45 t-shirts + 45 A4 frames + 45 shades packed into 3 secure cartons. Passed final QC.',
    JSON.stringify([
      { task: 'All 45 shirts printed', done: true },
      { task: 'All 45 frames checked and acrylic peeled', done: true },
      { task: 'Box packaging and labeling complete', done: true }
    ]),
    now
  );

  insertPayment.run(
    'pay_002',
    'JK-2026-0002',
    9450,
    '2026-10-03',
    'Bank Transfer',
    'NEFT/HDFC/9928374182',
    'paid',
    'INV-JK-2026-0002',
    'Full payment received in advance via NEFT',
    '2026-10-03T11:20:00Z'
  );

  insertShipping.run(
    'ship_002',
    'JK-2026-0002',
    'Rohan Kulkarni',
    'Hostel 14, Room 302, IIT Bombay, Powai, Mumbai 400076',
    3,
    45,
    'Delhivery Express',
    'DEL991827364IN',
    '2026-10-13',
    '2026-10-16',
    null,
    'ready_for_dispatch',
    'Air cargo dispatch scheduled for tomorrow morning.',
    now
  );

  // --- ORDER 3: JK-2026-0003 (SRM Chennai Fest, 80 shirts, Design Approval Stage) ---
  insertCustomer.run(
    'cust_003',
    'Kavitha Sundaram',
    '+91 97112 34567',
    '+91 97112 34567',
    'kavitha.fest@srmist.edu.in',
    'SRM Institute of Science and Technology, Chennai',
    'Mechanical Engineering - Aero Club',
    '2024 - 2028',
    'Aero Club, Mechanical Block, SRM IST, Kattankulathur, Chennai 603203',
    'Aero Club, Mechanical Block, SRM IST, Kattankulathur, Chennai 603203',
    1,
    10400,
    'Symposium aero-fest batch tees. High priority on college crest.',
    '2026-10-08T09:00:00Z'
  );

  insertOrder.run(
    'JK-2026-0003',
    'cust_003',
    'Kavitha Sundaram',
    '+91 97112 34567',
    '+91 97112 34567',
    'kavitha.fest@srmist.edu.in',
    'SRM Institute of Science and Technology, Chennai',
    'Mechanical Engineering - Aero Club',
    '2024 - 2028',
    'Aero Club, Mechanical Block, SRM IST, Chennai 603203',
    'Aero Club, Mechanical Block, SRM IST, Chennai 603203',
    'AERO-FEST 2026',
    'College Fest',
    '2026-12-05',
    '2026-11-28',
    80,
    80,
    'chain',
    'basic',
    130,
    0,
    0,
    0,
    0,
    520,
    10920,
    0,
    10920,
    'pending',
    'customer_approval',
    'packing_pending',
    'Interlocking Chain layout with club members. Front logo + Left sleeve sponsor logo.',
    'bold_minimal',
    '2026-10-08T09:30:00Z',
    now
  );

  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(3, '0');
    insertShirt.run(
      `JK-2026-0003-${padded}`,
      'JK-2026-0003',
      padded,
      `Aero Member ${i}`,
      `PILOT_${i}`,
      `AE${200 + i}`,
      'L',
      'White',
      '100% Bio-Washed Cotton (220 GSM)',
      'Half Sleeve',
      SAMPLE_AVATARS[i % SAMPLE_AVATARS.length],
      JSON.stringify([SAMPLE_AVATARS[i % SAMPLE_AVATARS.length]]),
      'AERO-FEST SRM',
      null,
      'Artwork revision 2 uploaded for review.',
      1,
      1,
      1, // Left sleeve sponsor
      0,
      80,
      1,
      'pending',
      '2026-10-08T10:00:00Z'
    );
  }

  insertProduction.run(
    'prod_003',
    'JK-2026-0003',
    'usr_designer',
    'Anjali Mehta',
    'standard',
    'customer_approval',
    null,
    '2026-11-25',
    null,
    0,
    80,
    0,
    0,
    'Customer requested slight repositioning of left sleeve sponsor logo. Revision sent to Kavitha.',
    JSON.stringify([
      { task: 'Collect student photos and list', done: true },
      { task: 'Generate Chain layout mockup', done: true },
      { task: 'Sponsor logo alignment on left sleeve', done: true },
      { task: 'Customer formal sign-off', done: false }
    ]),
    now
  );

  // --- ORDER 4: JK-2026-0004 (Loyola College Farewell, 35 shirts, Delivered) ---
  insertCustomer.run(
    'cust_004',
    'Antony Joseph',
    '+91 94433 22110',
    '+91 94433 22110',
    'antony.j@loyola.edu',
    'Loyola College, Chennai',
    'B.Com (Honours)',
    '2023 - 2026',
    'Commerce Block, Loyola College, Sterling Road, Nungambakkam, Chennai 600034',
    'Commerce Block, Loyola College, Sterling Road, Nungambakkam, Chennai 600034',
    1,
    5512.5,
    'Delivered successfully with zero defects. Customer left 5-star review.',
    '2026-09-15T10:00:00Z'
  );

  insertOrder.run(
    'JK-2026-0004',
    'cust_004',
    'Antony Joseph',
    '+91 94433 22110',
    '+91 94433 22110',
    'antony.j@loyola.edu',
    'Loyola College, Chennai',
    'B.Com (Honours)',
    '2023 - 2026',
    'Commerce Block, Loyola College, Chennai 600034',
    'Commerce Block, Loyola College, Chennai 600034',
    'B.Com Farewell 2026',
    'Farewell',
    '2026-10-02',
    '2026-09-28',
    35,
    35,
    'square',
    'salina',
    150,
    0,
    0,
    0,
    0,
    262.5,
    5512.5,
    5512.5,
    0,
    'paid',
    'delivered',
    'delivered',
    'Order complete and delivered in person.',
    'jersey',
    '2026-09-15T10:00:00Z',
    '2026-09-29T16:00:00Z'
  );

  insertPayment.run(
    'pay_004',
    'JK-2026-0004',
    5512.5,
    '2026-09-28',
    'UPI',
    'UPI/26092898765/ICICI',
    'paid',
    'INV-JK-2026-0004',
    'Full balance settled on delivery',
    '2026-09-28T14:00:00Z'
  );

  insertShipping.run(
    'ship_004',
    'JK-2026-0004',
    'Antony Joseph',
    'Commerce Block, Loyola College, Chennai 600034',
    1,
    35,
    'DTDC Courier',
    'DTDC99182746',
    '2026-09-26',
    '2026-09-28',
    '2026-09-28',
    'delivered',
    'Delivered and signed by Antony Joseph at college reception.',
    '2026-09-28T16:00:00Z'
  );

  // 6. Seed Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, start_date, expiry_date, usage_limit, used_count, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCoupon.run('cpn_farewell10', 'FAREWELL10', 'percentage', 10, 5000, 1500, '2026-01-01', '2027-12-31', 500, 24, 1, now);
  insertCoupon.run('cpn_bulk1000', 'BULK1000', 'fixed', 1000, 10000, 1000, '2026-01-01', '2027-12-31', 200, 12, 1, now);
  insertCoupon.run('cpn_earlybird', 'EARLYBIRD', 'percentage', 15, 6000, 2000, '2026-01-01', '2027-12-31', 100, 8, 1, now);

  // 7. Seed Enquiries
  const insertEnquiry = db.prepare(`
    INSERT INTO enquiries (id, customer_name, phone, email, college_name, subject, message, status, follow_up_date, internal_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEnquiry.run(
    'enq_001',
    'Sneha G',
    '+91 98888 11111',
    'sneha.bitshyd@gmail.com',
    'BITS Pilani - Hyderabad Campus',
    'Bulk Quote for 120 T-shirts with individual photo signatures',
    'Hello JK Empress, we are organizing our 4th year EEE department farewell with 120 students. Can we get custom hoodies or full sleeve t-shirts with our batch collage?',
    'new',
    '2026-11-12',
    'High potential bulk lead. Prepare quote for 120 pcs Salina pack.',
    now
  );

  insertEnquiry.run(
    'enq_002',
    'Vigneshwaran',
    '+91 97777 22222',
    'vignesh.vit@vitstudent.ac.in',
    'VIT Vellore',
    'Sample T-shirt print quality check',
    'Can you send a sample physical printed shirt or fabric swatch to our college address before we place 75 shirts order?',
    'contacted',
    '2026-11-11',
    'Dispatched sample swatch kit via DTDC on 9th Nov.',
    now
  );

  // 8. Seed Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, customer_name, college_name, rating, comment, order_id, is_approved, is_published_testimonial, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    'rev_001',
    'Antony Joseph',
    'Loyola College, Chennai',
    5,
    'The print clarity on every single classmate face in the Honeycomb layout was stunning! The fabric markers did not bleed at all on Signature Day. Everyone in our batch cherishes the shirts!',
    'JK-2026-0004',
    1,
    1,
    now
  );

  insertReview.run(
    'rev_002',
    'Rohan Kulkarni',
    'IIT Bombay',
    5,
    'Super fast turnaround! The personalized wooden photo frame included in the Top Pack was the highlight of our farewell. Highly recommend JK Empress for any college batch.',
    'JK-2026-0002',
    1,
    1,
    now
  );

  // 9. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run('notif_001', 'New Order Received', 'Order JK-2026-0003 created by Kavitha Sundaram (80 t-shirts)', 'order', '/admin/orders/JK-2026-0003', 0, now);
  insertNotif.run('notif_002', 'Order Milestone', '42 of 60 t-shirts processed for Order JK-2026-0001', 'order', '/admin/orders/JK-2026-0001', 0, now);
  insertNotif.run('notif_003', 'Advance Payment Received', '₹5,000 paid via UPI for Order JK-2026-0001', 'payment', '/admin/finance', 0, now);
  insertNotif.run('notif_004', 'Design Approved', 'Order JK-2026-0001 artwork approved and ready for printing', 'order', '/admin/orders/JK-2026-0001', 0, now);

  // 10. Seed Activity Logs
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, user_name, user_role, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLog.run('act_001', 'JK Empress Admin', 'Admin', 'System Initialized', 'system', 'sys_init', 'Database schema created & seed data populated', '127.0.0.1', now);
  insertLog.run('act_002', 'JK Empress Admin', 'Admin', 'Order Confirmed', 'order', 'JK-2026-0001', 'Confirmed 60 t-shirts order for A K P S College', '127.0.0.1', now);
  insertLog.run('act_003', 'JK Empress Admin', 'Admin', 'Design Uploaded', 'design', 'des_001_001_front', 'Uploaded front Honeycomb rosette high-res artwork', '127.0.0.1', now);
  insertLog.run('act_004', 'JK Empress Admin', 'Admin', 'Printing Started', 'production', 'prod_001', 'Started DTG print run for 60 shirts', '127.0.0.1', now);
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
