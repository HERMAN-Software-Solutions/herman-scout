-- 1. Main Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  company_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new', -- new -> audited -> ready -> emailed
  score INT DEFAULT 0,
  tech_stack JSONB,
  pain_points JSONB,
  pitch_hooks JSONB,
  ai_pitch TEXT,
  source VARCHAR(100),
  first_seen_at TIMESTAMP DEFAULT NOW(),
  audited_at TIMESTAMP,
  emailed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_status_score ON leads(status, score DESC);

-- 2. Permanent Send Log (Audit trail)
CREATE TABLE IF NOT EXISTS send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  domain VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  batch_id UUID,
  status VARCHAR(50) DEFAULT 'sent',
  brevo_message_id VARCHAR(255),
  error TEXT
);

-- 3. Blacklist (Never contact)
CREATE TABLE IF NOT EXISTS blacklist (
  domain VARCHAR(255) PRIMARY KEY,
  reason VARCHAR(255),
  added_at TIMESTAMP DEFAULT NOW()
);

-- 4. Scan Log (Tracks when we refill the tank)
CREATE TABLE IF NOT EXISTS scan_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  leads_added INT DEFAULT 0,
  ready_count_after INT,
  source VARCHAR(100)
);