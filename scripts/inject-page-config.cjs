#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node inject-page-config.cjs <dist-directory>');
  process.exit(1);
}

const distDir = process.argv[2];
const configPath = path.join(process.cwd(), 'site.config.json');
if (!fs.existsSync(configPath)) {
  console.error('site.config.json not found in project root');
  process.exit(1);
}
const siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const pageConfigs = (siteConfig.pages && typeof siteConfig.pages === 'object') ? siteConfig.pages : {};

const htmlFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
  const filePath = path.join(distDir, file);
  const pageKey = file.replace('.html', '');
  const perPageConfig = pageConfigs[pageKey] || {};
  const html = fs.readFileSync(filePath, 'utf8');
  const configScript = `<script type="application/json" id="page-config">\n${JSON.stringify(perPageConfig, null, 2)}\n<\/script>`;
  const injected = `{{current_page}}=${JSON.stringify(pageKey)}\n${configScript}\n` + html.replace(/^\{\{current_page\}\}=.*?\n<script type="application\/json" id="page-config">[\s\S]*?<\/script>\n?/, '');
  fs.writeFileSync(filePath, injected, 'utf8');
  console.log(`Injected per-page config and current_page into ${filePath}`);
}
console.log('All HTML files in dist/ have been injected with per-page config.'); 