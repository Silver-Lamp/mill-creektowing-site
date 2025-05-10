import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function migrateSite(siteDir) {
  const changes = [];
  const errors = [];

  // Read site config
  const configPath = path.join(siteDir, 'site.config.json');
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    errors.push(`Failed to read site.config.json: ${e.message}`);
    return { changes, errors };
  }

  // Process HTML files
  const htmlFiles = fs.readdirSync(siteDir)
    .filter(file => file.endsWith('.html'));

  htmlFiles.forEach(file => {
    const filePath = path.join(siteDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace individual service area placeholders
    const serviceAreaMatches = content.match(/\{\{service_area_\d+\}\}/g);
    if (serviceAreaMatches) {
      // Get unique service areas from config
      const serviceAreas = [...new Set(config.service_areas || [])];
      
      // Replace each placeholder with the corresponding service area
      serviceAreaMatches.forEach((match, index) => {
        const serviceArea = serviceAreas[index] || '';
        content = content.replace(match, serviceArea);
      });

      // Add the service_areas placeholder if not present
      if (!content.includes('{{service_areas}}')) {
        const serviceAreasSection = content.match(/<section[^>]*class="[^"]*service-areas[^"]*"[^>]*>[\s\S]*?<\/section>/);
        if (serviceAreasSection) {
          content = content.replace(
            serviceAreasSection[0],
            `<section class="service-areas">
              <h2>Service Areas</h2>
              <p>{{service_areas}}</p>
            </section>`
          );
        }
      }

      modified = true;
      changes.push(`Updated service area placeholders in ${file}`);
    }

    // Replace hardcoded testimonials
    if (content.includes('testimonial') && !content.includes('{{testimonials_section}}')) {
      const testimonialsSection = content.match(/<section[^>]*class="[^"]*testimonials[^"]*"[^>]*>[\s\S]*?<\/section>/);
      if (testimonialsSection) {
        content = content.replace(
          testimonialsSection[0],
          `<section class="testimonials">
            {{testimonials_section}}
          </section>`
        );
        modified = true;
        changes.push(`Updated testimonials section in ${file}`);
      }
    }

    if (modified) {
      try {
        // Backup original file
        fs.copyFileSync(filePath, `${filePath}.bak`);
        // Write updated content
        fs.writeFileSync(filePath, content);
      } catch (e) {
        errors.push(`Failed to update ${file}: ${e.message}`);
      }
    }
  });

  return { changes, errors };
}

// Run migration if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const siteDir = process.argv[2];
  if (!siteDir) {
    console.error('Please provide the site directory path');
    process.exit(1);
  }

  const { changes, errors } = migrateSite(siteDir);
  
  if (changes.length) {
    console.log('\nChanges made:');
    changes.forEach(c => console.log('✅', c));
  } else {
    console.log('No changes needed');
  }
  
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach(e => console.error('❌', e));
    process.exit(1);
  }
}

export { migrateSite }; 