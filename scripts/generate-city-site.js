import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateTemplate } from './validate-template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateCitySite(cityName, coordinates) {
  const templateDir = path.join(__dirname, '..', 'template');
  const outputDir = path.join(__dirname, '..', 'dist');

  // Validate template before generation
  const { errors, warnings } = validateTemplate(templateDir);
  if (errors.length) {
    console.error('Template validation failed:');
    errors.forEach(e => console.error('❌', e));
    process.exit(1);
  }
  if (warnings.length) {
    console.warn('Template warnings:');
    warnings.forEach(w => console.warn('⚠️', w));
  }

  // Update config with city-specific data
  const config = JSON.parse(fs.readFileSync(path.join(templateDir, 'site.config.json'), 'utf8'));
  config.location_name = cityName;
  config.coordinates = coordinates;
  config.service_areas = await generateServiceAreas(cityName, coordinates);
  
  // Validate generated config
  const { errors: configErrors } = validateTemplate(templateDir);
  if (configErrors.length) {
    console.error('Generated config validation failed:');
    configErrors.forEach(e => console.error('❌', e));
    process.exit(1);
  }

  // Copy and process HTML files
  const htmlFiles = fs.readdirSync(templateDir)
    .filter(file => file.endsWith('.html'));

  for (const file of htmlFiles) {
    let content = fs.readFileSync(path.join(templateDir, file), 'utf8');
    
    // Replace placeholders
    content = content.replace(/\{\{location_name\}\}/g, cityName);
    content = content.replace(/\{\{service_areas\}\}/g, config.service_areas.join(', '));
    content = content.replace(/\{\{testimonials_section\}\}/g, generateTestimonialsSection(config.testimonials));
    
    fs.writeFileSync(path.join(outputDir, file), content);
  }
}

export { generateCitySite }; 