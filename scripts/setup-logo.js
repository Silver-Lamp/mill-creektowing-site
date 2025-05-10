import fs from 'fs';
import { generateDefaultLogo } from './generate-logo.js';

async function setupLogo() {
  try {
    // Read site config
    const siteConfig = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
    // Always use city overlay
    siteConfig.useCityOverlay = true;
    fs.writeFileSync('site.config.json', JSON.stringify(siteConfig, null, 2));
    // Generate default logo
    await generateDefaultLogo(siteConfig.location_name, 'images');
    console.log('Default logo generated (logo.png, logo.webp) with city overlay.');
  } catch (error) {
    console.error('Error setting up logo:', error);
    process.exit(1);
  }
}

setupLogo(); 