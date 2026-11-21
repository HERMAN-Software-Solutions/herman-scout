# HERMAN Scout 🕷️

Continuous lead-generation pipeline for HERMAN Software Solutions.

## What It Does

- **Scans** public business websites for contact emails + tech issues
- **Audits** each site (HTTPS, mobile, speed, CMS, jQuery, analytics)
- **Scores** leads 0–100 based on pain points
- **Sends** batched cold emails via Brevo (max 20/day)
- **Never** emails the same lead twice
- **Runs forever** on a low-cost, mostly-free stack

## The "Water Tank" Logic
IF ready_leads <= 20:
SCAN (add up to 100 new leads)
IF today is a send day:
SEND 20 emails from the batch
MARK each as 'emailed' (permanent)

text

## Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Database | Neon Postgres | Free |
| Crawler | Node.js + Cheerio + Axios | Free |
| AI | Google Gemini | Free (1500/day) |
| Email | Brevo | Free (300/day) |
| Scheduler | node-cron | Free |

## Setup

1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill in API keys
4. `npm run db:init` (creates tables in Neon)
5. `npm run test:autopsy -- https://example.com` (test the crawler)
6. `npm start` (start the cron loop)

## Build Phases

- [x] Phase 0: Repo + setup
- [ ] Phase 1: Neon DB + schema
- [ ] Phase 2: Autopsy engine
- [ ] Phase 3: Water tank logic
- [ ] Phase 4: Brevo sender
- [ ] Phase 5: Cron scheduler
- [ ] Phase 6: Logging

## License

Private - HERMAN Software Solutions