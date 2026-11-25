require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('@neondatabase/serverless');

async function initDB() {
  console.log('🔄 Connecting to Neon...');
  
  const client = new Client(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📝 Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Executing schema...');
    
    // Execute the entire schema as one block (Postgres handles multiple CREATE TABLEs perfectly)
    await client.query(schemaSql);

    console.log('✅ Database initialized successfully!');
    console.log('🎉 Phase 1 complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await client.end();
  }
}

initDB();