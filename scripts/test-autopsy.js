const { runAutopsy } = require('../src/crawler/autopsy');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/test-autopsy.js https://example.com');
  process.exit(1);
}

console.log(`🕷️  Crawling ${target}...\n`);

runAutopsy(target).then((result) => {
  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
});