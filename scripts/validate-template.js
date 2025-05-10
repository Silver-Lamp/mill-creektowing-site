import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateTemplate(templateDir) {
  const errors = [];
  const warnings = [];

  // Check for deprecated placeholders
  const htmlFiles = fs.readdirSync(templateDir)
    .filter(file => file.endsWith('.html'));

  htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(templateDir, file), 'utf8');
    
    // Check for individual service area placeholders
    const serviceAreaMatches = content.match(/\{\{service_area_\d+\}\}/g);
    if (serviceAreaMatches) {
      errors.push(`File ${file} uses deprecated service_area_N placeholders. Use {{service_areas}} instead.`);
    }

    // Check for hardcoded testimonials
    if (content.includes('testimonial') && !content.includes('{{testimonials_section}}')) {
      errors.push(`File ${file} has hardcoded testimonials. Use {{testimonials_section}} instead.`);
    }

    // Check for hardcoded service areas
    if (content.includes('service-areas') && !content.includes('{{service_areas}}')) {
      errors.push(`File ${file} has hardcoded service areas. Use {{service_areas}} instead.`);
    }
  });

  // Check config template
  const configPath = path.join(templateDir, 'site.config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Validate required fields
    const requiredFields = ['business.name', 'phone_number', 'location_name', 'coordinates', 'service_areas'];
    requiredFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], config);
      if (!value) {
        errors.push(`Missing required field in site.config.json: ${field}`);
      }
    });

    // Validate service areas
    if (config.service_areas && !Array.isArray(config.service_areas)) {
      errors.push('service_areas must be an array in site.config.json');
    }
  } else {
    errors.push('Missing site.config.json template');
  }

  return { errors, warnings };
}

// Export for use in generate-city-site.js
export { validateTemplate };

// Run validation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const templateDir = path.join(__dirname, '..', 'template');
  const { errors, warnings } = validateTemplate(templateDir);
  
  if (warnings.length) {
    console.warn('\nWarnings:');
    warnings.forEach(w => console.warn('⚠️', w));
  }
  
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach(e => console.error('❌', e));
    process.exit(1);
  } else {
    console.log('✅ Template validation passed');
  }
} 