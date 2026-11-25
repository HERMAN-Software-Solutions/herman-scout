import { sql } from './client';

export interface LeadInsert {
  domain: string;
  email: string;
  company_name?: string;
  score: number;
  tech_stack: any;
  pain_points: any;
  pitch_hooks: any;
  source: string;
}

// 1. Check if domain exists (Dedupe Lock 1)
export async function domainExists(domain: string): Promise<boolean> {
  const result = await sql`SELECT id FROM leads WHERE domain = ${domain} LIMIT 1`;
  return result.length > 0;
}

// 2. Check if email exists (Dedupe Lock 2)
export async function emailExists(email: string): Promise<boolean> {
  const result = await sql`SELECT id FROM leads WHERE email = ${email} LIMIT 1`;
  return result.length > 0;
}

// 3. Insert a new lead
export async function insertLead(lead: LeadInsert) {
  return await sql`
    INSERT INTO leads (
      domain, email, company_name, status, score, tech_stack, pain_points, pitch_hooks, source
    ) VALUES (
      ${lead.domain}, ${lead.email}, ${lead.company_name || null}, 'ready', 
      ${lead.score}, ${JSON.stringify(lead.tech_stack)}, ${JSON.stringify(lead.pain_points)}, 
      ${JSON.stringify(lead.pitch_hooks)}, ${lead.source}
    )
    ON CONFLICT (domain) DO NOTHING
    RETURNING id;
  `;
}

// 4. Get Ready Count (Water Tank Check)
export async function getReadyCount(): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::int as count FROM leads 
    WHERE status = 'ready' 
      AND score >= 60 
      AND email IS NOT NULL 
      AND domain NOT IN (SELECT domain FROM blacklist)
  `;
  return result[0].count;
}

// 5. Select Batch for Sending
export async function selectBatch(limit: number) {
  return await sql`
    SELECT * FROM leads
    WHERE status = 'ready'
      AND score >= 60
      AND email IS NOT NULL
      AND domain NOT IN (SELECT domain FROM blacklist)
    ORDER BY score DESC, first_seen_at ASC
    LIMIT ${limit}
  `;
}

// 6. Mark as Emailed (Permanent Lock)
export async function markEmailed(leadId: string) {
  return await sql`
    UPDATE leads SET status = 'emailed', emailed_at = NOW() WHERE id = ${leadId}
  `;
}

// 7. Log the Scan
export async function logScan(leadsAdded: number, readyAfter: number) {
  return await sql`
    INSERT INTO scan_log (leads_added, ready_count_after, source, completed_at)
    VALUES (${leadsAdded}, ${readyAfter}, 'google_maps', NOW())
  `;
}// All DB queries (Phase 1)
export {};
