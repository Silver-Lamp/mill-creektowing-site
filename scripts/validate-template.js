import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateTemplate(templateDir) {
  const errors = [];
  const warnings = [];

  // Check for deprecated placeholders and hardcoded values
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

    // Check for hardcoded city names
    const cityMatches = content.match(/\b(Mill Creek|Seattle|Bellevue|Everett|Renton|Kirkland|Redmond)\b/g);
    if (cityMatches) {
      errors.push(`File ${file} contains hardcoded city names: ${cityMatches.join(', ')}. Use {{location_name}} or {{service_areas}} instead.`);
    }

    // Check for hardcoded business names
    if (content.includes('Mill Creek Towing') && !content.includes('{{business.name}}')) {
      errors.push(`File ${file} contains hardcoded business name. Use {{business.name}} instead.`);
    }

    // Check for hardcoded phone numbers
    if (content.includes('(425) 270-2226') && !content.includes('{{phone_number}}')) {
      errors.push(`File ${file} contains hardcoded phone number. Use {{phone_number}} instead.`);
    }

    // Check for hardcoded addresses
    if (content.includes('16000 Bothell Everett Hwy') && !content.includes('{{address.street}}')) {
      errors.push(`File ${file} contains hardcoded address. Use {{address.street}} instead.`);
    }
  });

  // Validate site.config.json
  const configPath = path.join(templateDir, 'site.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check required fields
      const requiredFields = [
        'business.name',
        'phone_number',
        'location_name',
        'coordinates',
        'service_areas'
      ];
      
      requiredFields.forEach(field => {
        if (!getNestedValue(config, field)) {
          errors.push(`Missing required field in site.config.json: ${field}`);
        }
      });

      // Validate service_areas
      if (config.service_areas) {
        if (!Array.isArray(config.service_areas)) {
          errors.push('service_areas must be an array in site.config.json');
        } else if (config.service_areas.length === 0) {
          errors.push('service_areas array is empty in site.config.json');
        } else if (config.service_areas.some(area => typeof area !== 'string')) {
          errors.push('All service areas must be strings in site.config.json');
        }
      }

      // Validate testimonials
      if (config.testimonials) {
        const testimonialKeys = Object.keys(config.testimonials);
        testimonialKeys.forEach(key => {
          const testimonial = config.testimonials[key];
          if (!testimonial.city || !testimonial.text || !testimonial.author) {
            errors.push(`Testimonial ${key} is missing required fields (city, text, or author)`);
          }
        });
      }
    } catch (e) {
      errors.push(`Error parsing site.config.json: ${e.message}`);
    }
  } else {
    errors.push('site.config.json not found in template directory');
  }

  return { errors, warnings };
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

// Export for use in generate-city-site.js
export { validateTemplate };

// Run validation if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Change to use 'dist' for HTML and root 'site.config.json' for config
  const distDir = path.join(__dirname, '..', 'dist');
  const configPath = path.join(__dirname, '..', 'site.config.json');

  // Validate HTML files in dist
  const errors = [];
  const warnings = [];
  const htmlFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.html'));
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(distDir, file), 'utf8');
    // (same checks as before)
    const serviceAreaMatches = content.match(/\{\{service_area_\d+\}\}/g);
    if (serviceAreaMatches) {
      errors.push(`File ${file} uses deprecated service_area_N placeholders. Use {{service_areas}} instead.`);
    }
    if (content.includes('testimonial') && !content.includes('{{testimonials_section}}')) {
      errors.push(`File ${file} has hardcoded testimonials. Use {{testimonials_section}} instead.`);
    }
    if (content.includes('service-areas') && !content.includes('{{service_areas}}')) {
      errors.push(`File ${file} has hardcoded service areas. Use {{service_areas}} instead.`);
    }
    // New: Check for Service Areas card
    if (!content.includes('class="card service-areas-card"')) {
      errors.push(`File ${file} is missing the Service Areas card (class=\"card service-areas-card\").`);
    }
    const cityMatches = content.match(/\b(Mill Creek|Seattle|Bellevue|Everett|Renton|Kirkland|Redmond)\b/g);
    if (cityMatches) {
      errors.push(`File ${file} contains hardcoded city names: ${cityMatches.join(', ')}. Use {{location_name}} or {{service_areas}} instead.`);
    }
    if (content.includes('Mill Creek Towing') && !content.includes('{{business.name}}')) {
      errors.push(`File ${file} contains hardcoded business name. Use {{business.name}} instead.`);
    }
    if (content.includes('(425) 270-2226') && !content.includes('{{phone_number}}')) {
      errors.push(`File ${file} contains hardcoded phone number. Use {{phone_number}} instead.`);
    }
    if (content.includes('16000 Bothell Everett Hwy') && !content.includes('{{address.street}}')) {
      errors.push(`File ${file} contains hardcoded address. Use {{address.street}} instead.`);
    }
  });

  // Validate site.config.json in root
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const requiredFields = [
        'business.name',
        'phone_number',
        'location_name',
        'coordinates',
        'service_areas'
      ];
      requiredFields.forEach(field => {
        if (!getNestedValue(config, field)) {
          errors.push(`Missing required field in site.config.json: ${field}`);
        }
      });
      if (config.service_areas) {
        if (!Array.isArray(config.service_areas)) {
          errors.push('service_areas must be an array in site.config.json');
        } else if (config.service_areas.length === 0) {
          errors.push('service_areas array is empty in site.config.json');
        } else if (config.service_areas.some(area => typeof area !== 'string')) {
          errors.push('All service areas must be strings in site.config.json');
        }
      }
      if (config.testimonials) {
        const testimonialKeys = Object.keys(config.testimonials);
        testimonialKeys.forEach(key => {
          const testimonial = config.testimonials[key];
          if (!testimonial.city || !testimonial.text || !testimonial.author) {
            errors.push(`Testimonial ${key} is missing required fields (city, text, or author)`);
          }
        });
      }
    } catch (e) {
      errors.push(`Error parsing site.config.json: ${e.message}`);
    }
  } else {
    errors.push('site.config.json not found in project root');
  }

  if (warnings.length) {
    console.warn('\nWarnings:');
    warnings.forEach(w => console.warn('⚠️', w));
  }
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach(e => console.error('❌', e));
    process.exit(1);
  } else {
    console.log('✅ Build/dist validation passed');
  }
} 