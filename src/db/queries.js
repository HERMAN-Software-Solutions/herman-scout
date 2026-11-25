const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 1. Dedupe Lock 1: Domain exists?
async function domainExists(domain) {
  const result = await sql`SELECT id FROM leads WHERE domain = ${domain} LIMIT 1`;
  return result.length > 0;
}

// 2. Dedupe Lock 2: Email exists?
async function emailExists(email) {
  const result = await sql`SELECT id FROM leads WHERE email = ${email} LIMIT 1`;
  return result.length > 0;
}

// 3. Insert a new lead
async function insertLead(lead) {
  return await sql`
    INSERT INTO leads (
      domain, email, status, score, tech_stack, pain_points, pitch_hooks, source
    ) VALUES (
      ${lead.domain}, ${lead.email}, 'ready', 
      ${lead.score}, ${JSON.stringify(lead.tech_stack)}, ${JSON.stringify(lead.pain_points)}, 
      ${JSON.stringify(lead.pitch_hooks)}, 'manual_test'
    )
    ON CONFLICT (domain) DO NOTHING
    RETURNING id;
  `;
}

// 4. Get Ready Count (Water Tank Check)
async function getReadyCount() {
  const result = await sql`
    SELECT COUNT(*)::int as count FROM leads 
    WHERE status = 'ready' 
      AND score >= 60 
      AND email IS NOT NULL 
      AND domain NOT IN (SELECT domain FROM blacklist)
  `;
  return result[0].count;
}

// 5. Log the Scan
async function logScan(leadsAdded, readyAfter) {
  return await sql`
    INSERT INTO scan_log (leads_added, ready_count_after, source, completed_at)
    VALUES (${leadsAdded}, ${readyAfter}, 'manual_test', NOW())
  `;
}

module.exports = {
  domainExists,
  emailExists,
  insertLead,
  getReadyCount,
  logScan
};