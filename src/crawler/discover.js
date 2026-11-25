const fs = require('fs');
const path = require('path');

async function discoverUrls(query, limit = 10) {
  console.log(`🔍 Reading target URLs from targets.txt...`);
  
  try {
    const filePath = path.join(__dirname, '../../targets.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Split by new lines, remove spaces, and filter out empty lines
    const urls = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith('http'));

    const uniqueUrls = [...new Set(urls)].slice(0, limit);
    console.log(`✅ Found ${uniqueUrls.length} URLs in your list.`);
    return uniqueUrls;

  } catch (error) {
    console.error('❌ Failed to read targets.txt. Did you create it?', error.message);
    return [];
  }
}

module.exports = { discoverUrls };