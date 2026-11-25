import { sql } from '../src/db/client';
import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env';

async function initDB() {
  console.log('🔄 Connecting to Neon...');
  
  try {
    // Test connection
    const test = await sql`SELECT NOW() as now`;
    console.log(`✅ Connected successfully at ${test[0].now}`);

    // Read schema
    console.log('📝 Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Neon requires executing multi-statement SQL carefully.
    // We split by semicolon and execute one by one.
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🚀 Executing ${statements.length} SQL statements...`);

    for (const stmt of statements) {
      await sql.query(stmt);
    }

    console.log('✅ Database initialized successfully!');
    console.log('🎉 Phase 1 complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDB();