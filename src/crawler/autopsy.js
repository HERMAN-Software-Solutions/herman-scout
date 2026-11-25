const axios = require('axios');
const cheerio = require('cheerio');

async function runAutopsy(url) {
  const start = Date.now();
  const painPoints = [];
  const pitchHooks = [];
  const frameworks = [];
  const analytics = [];

  try {
    // 1. Fetch the page
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'HERMAN-Scout/1.0 (+https://herman.ug; audit for outreach)',
      },
      validateStatus: () => true,
    });

    const loadTimeMs = Date.now() - start;
    const finalUrl = response.request?.res?.responseUrl || url;
    const https = finalUrl.startsWith('https://');
    const html = response.data;
    const $ = cheerio.load(html);

    // 2. HTTPS check
    if (!https) {
      painPoints.push('no_https');
      pitchHooks.push('Your site loads over plain HTTP — Chrome shows "Not Secure" which scares off visitors.');
    }

    // 3. Viewport (mobile responsiveness)
    if (!$('meta[name="viewport"]').length) {
      painPoints.push('no_mobile_viewport');
      pitchHooks.push('Your site is missing a mobile viewport tag — it renders like a desktop page on phones, making it hard to read.');
    }

    // 4. Load time
    if (loadTimeMs > 3000) {
      painPoints.push('slow_load');
      pitchHooks.push(`Your homepage took ${(loadTimeMs / 1000).toFixed(1)}s to respond — Google and visitors both penalize this.`);
    }

    // 5. CMS / generator
    const generator = $('meta[name="generator"]').attr('content');
    if (generator) {
      const yearMatch = generator.match(/(\d{4})/);
      if (yearMatch && parseInt(yearMatch[1]) < new Date().getFullYear() - 1) {
        painPoints.push('outdated_cms');
        pitchHooks.push(`You're running ${generator} — that version is over a year old and missing security patches.`);
      }
    }

    // 6. jQuery version
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const match = src.match(/jquery[.-](\d+\.\d+\.\d+)/i);
      if (match) {
        const major = parseInt(match[1].split('.')[0]);
        if (major < 3) {
          painPoints.push('outdated_jquery');
          pitchHooks.push(`Your site uses jQuery ${match[1]} (released years ago) — known performance and security concerns.`);
        }
      }
    });

    // 7. Frameworks detection
    const htmlLower = html.toLowerCase();
    if (htmlLower.includes('wp-content')) frameworks.push('WordPress');
    if (htmlLower.includes('_next/')) frameworks.push('Next.js');
    if (htmlLower.includes('cdn.shopify')) frameworks.push('Shopify');
    if (htmlLower.includes('wix.com')) frameworks.push('Wix');

    // 8. Analytics
    if (htmlLower.includes('googletagmanager.com/gtag') || htmlLower.includes('google-analytics.com')) {
      analytics.push('Google Analytics');
    } else {
      painPoints.push('no_analytics');
      pitchHooks.push("We couldn't find any analytics on your site — you may be flying blind on visitor numbers.");
    }

    // 9. Meta description
    if (!$('meta[name="description"]').attr('content')?.trim()) {
      painPoints.push('no_meta_description');
      pitchHooks.push('Your site has no meta description — Google shows generic text under your link in search results.');
    }

    // 10. Contact form check
    const hasContactForm = $('form input[type="email"]').length > 0 || $('form textarea').length > 0;
    if (!hasContactForm) {
      painPoints.push('no_contact_form');
      pitchHooks.push('No contact form detected on your homepage — visitors must switch to email apps to reach you.');
    }

    // 11. Copyright year
    const copyrightMatch = html.match(/©\s*(\d{4})|copyright\s*(\d{4})/i);
    const copyrightYear = copyrightMatch && parseInt(copyrightMatch[1] || copyrightMatch[2]);
    if (copyrightYear && copyrightYear < new Date().getFullYear() - 1) {
      painPoints.push('outdated_copyright');
      pitchHooks.push(`Your footer still says © ${copyrightYear} — first-time visitors may think the business is inactive.`);
    }

    // 12. Email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const rawEmails = html.match(emailRegex) || [];
    const badDomains = ['example.com', 'sentry.io', 'wixpress.com', 'wordpress.com'];
    const badExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    
    const emails = Array.from(new Set(
      rawEmails
        .map((e) => e.toLowerCase())
        .filter((e) => 
          !badDomains.some((d) => e.endsWith(d)) && 
          !badExts.some((ext) => e.endsWith(ext)) &&
          !e.startsWith('u003')
        )
    ));

    // 13. Scoring
    let score = 0;
    score += painPoints.length * 12;
    if (emails.length > 0) score += 20;
    if (frameworks.includes('WordPress')) score += 5;
    score = Math.min(score, 100);

    return {
      url,
      finalUrl,
      https,
      loadTimeMs,
      emails,
      tech_stack: { generator, frameworks, analytics },
      pain_points: painPoints,
      score,
      pitch_hooks: pitchHooks,
    };

  } catch (error) {
    console.error(`❌ Failed to crawl ${url}:`, error.message);
    return null;
  }
}

module.exports = { runAutopsy };