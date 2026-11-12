/**
 * JK EMPRESS — SQLite to Supabase PostgreSQL Migration Utility
 *
 * Exports all existing records from local SQLite (data/jkempress.db)
 * and formats them for direct insertion into Supabase PostgreSQL.
 *
 * Can run in two modes:
 * 1. Live API mode: If SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY are set, writes directly via Supabase client.
 * 2. SQL / JSON Export mode: Always generates 'supabase/seed_migration.sql' and 'data/export_for_supabase.json'
 *    which can be run directly in the Supabase SQL Editor.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);

// Load DatabaseSync
function getSqliteDb() {
  const sqlite = require('node:sqlite');
  const dbPath = path.resolve(process.cwd(), 'data', 'jkempress.db');
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Local database file not found at ${dbPath}`);
  }
  return new sqlite.DatabaseSync(dbPath);
}

const TABLES = [
  'admin_users',
  'customers',
  'orders',
  'individual_tshirts',
  'design_files',
  'design_versions',
  'production_records',
  'products',
  'inventory_items',
  'inventory_logs',
  'payments',
  'expenses',
  'shipping_records',
  'coupons',
  'enquiries',
  'reviews',
  'notifications',
  'activity_logs',
  'business_settings',
];

async function main() {
  console.log('================================================================');
  console.log('JK EMPRESS: Starting SQLite to Supabase Migration Utility');
  console.log('================================================================');

  const db = getSqliteDb();
  const exportData: Record<string, any[]> = {};
  const sqlStatements: string[] = ['-- Auto-generated Supabase PostgreSQL seed migration\n'];

  let totalMigrated = 0;

  for (const table of TABLES) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all() as any[];
      exportData[table] = rows;
      console.log(`📦 Table [${table}]: read ${rows.length} records`);
      totalMigrated += rows.length;

      if (rows.length > 0) {
        // Generate SQL Insert for Supabase SQL Editor
        const cols = Object.keys(rows[0]);
        const colList = cols.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const valList = cols
            .map(c => {
              const val = row[c];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              // Escape single quotes for SQL
              return `'${String(val).replace(/'/g, "''")}'`;
            })
            .join(', ');

          sqlStatements.push(
            `INSERT INTO "${table}" (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;`
          );
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ Skipped table [${table}]:`, err.message);
    }
  }

  // Save SQL Seed file
  const sqlPath = path.resolve(process.cwd(), 'supabase', 'seed_migration.sql');
  fs.writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf8');
  console.log(`\n✅ Generated SQL seed script: ${sqlPath} (${Math.round(fs.statSync(sqlPath).size / 1024)} KB)`);

  // Save JSON Dump
  const jsonPath = path.resolve(process.cwd(), 'data', 'export_for_supabase.json');
  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf8');
  console.log(`✅ Generated JSON export dump: ${jsonPath} (${Math.round(fs.statSync(jsonPath).size / 1024)} KB)`);

  // Check if live Supabase credentials are present
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log('\n🚀 SUPABASE CREDENTIALS DETECTED: Uploading records directly to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const table of TABLES) {
      const records = exportData[table] || [];
      if (records.length === 0) continue;

      const { data, error } = await supabase.from(table).upsert(records, { onConflict: 'id' });
      if (error) {
        console.error(`❌ Error migrating [${table}] to Supabase:`, error.message);
      } else {
        console.log(`✨ Successfully uploaded ${records.length} records to Supabase table [${table}]`);
      }
    }
  } else {
    console.log('\nℹ️ No live SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY environment variables found.');
    console.log('   The generated "supabase/seed_migration.sql" can be executed directly in the Supabase Dashboard SQL Editor.');
  }

  console.log('\n================================================================');
  console.log(`MIGRATION UTILITY FINISHED: Processed ${totalMigrated} total records across ${TABLES.length} tables.`);
  console.log('================================================================');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
