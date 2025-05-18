import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';
import { generateDefaultLogo } from './scripts/generate-logo.js';
import { spawnSync } from 'child_process';

// Read site config
const siteConfig = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));

// Helper function to get nested value
function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

// Helper function to validate placeholders
function validatePlaceholders(content) {
  const errors = [];
  const warnings = [];

  // Check for deprecated placeholders
  const deprecatedPlaceholders = {
    'service_area_\\d+': 'Use {{service_areas}} instead',
    'testimonial[1-3]\\.(text|author|city|state)': 'Use {{testimonials_section}} instead'
  };

  Object.entries(deprecatedPlaceholders).forEach(([pattern, message]) => {
    const matches = content.match(new RegExp(`\\{\\{${pattern}\\}\\}`, 'g'));
    if (matches) {
      errors.push(`Found deprecated placeholder(s): ${matches.join(', ')}. ${message}`);
    }
  });

  // Check for unmerged placeholders
  const unmergedMatches = content.match(/\{\{[^}]+\}\}/g);
  if (unmergedMatches) {
    warnings.push(`Found unmerged placeholders: ${unmergedMatches.join(', ')}`);
  }

  return { errors, warnings };
}

// Helper function to process #each blocks
function processEachBlocks(content, siteConfig) {
  let result = content;
  const eachRegex = /#each\s+([^\s]+)([\s\S]*?)\/each/g;
  
  result = result.replace(eachRegex, (match, arrayPath, template) => {
    // Try both service_areas and service_area keys
    let array;
    if (arrayPath === 'service_areas' || arrayPath === 'service_area') {
      array = siteConfig.service_areas || siteConfig.service_area;
    } else {
      array = getNestedValue(siteConfig, arrayPath);
    }
    
    if (!array || !Array.isArray(array)) {
      console.warn(`Warning: No array found for ${arrayPath}`);
      return '';
    }
    
    // Special handling for service areas in list format
    if ((arrayPath === 'service_areas' || arrayPath === 'service_area') && template.includes('<li>')) {
      return array.map(item => `<li>${item}</li>`).join('\n');
    }
    
    // Default handling for other arrays
    return array.map(item => {
      let itemTemplate = template.trim();
      // Replace {{this}} with the actual item
      itemTemplate = itemTemplate.replace(/\{\{this\}\}/g, item);
      return itemTemplate;
    }).join('\n');
  });
  
  return result;
}

// Helper function to process service areas
function processServiceAreas(content, siteConfig) {
  // Try both service_areas and service_area keys
  const areas = siteConfig.service_areas || siteConfig.service_area;
  if (!areas || !Array.isArray(areas)) {
    console.error('Error: No service areas found in config');
    return content;
  }
  // Deduplicate service areas, keeping first occurrence (case-insensitive)
  const dedupedAreas = Array.from(new Set(areas.map(area => area.trim().toLowerCase())))
    .map(lower => areas.find(area => area.trim().toLowerCase() === lower));
  // Alphabetize all cities (including the main city)
  const sortedAreas = [...dedupedAreas].sort((a, b) => a.localeCompare(b));
  // Fill columns row-wise for top-to-bottom, left-to-right order
  const rows = Math.ceil(sortedAreas.length / 2);
  const column1 = [];
  const column2 = [];
  for (let i = 0; i < rows; i++) {
    if (sortedAreas[i]) column1.push(sortedAreas[i]);
    if (sortedAreas[i + rows]) column2.push(sortedAreas[i + rows]);
  }
  // Bold the main city (case-insensitive, trimmed)
  function renderArea(area) {
    const mainCity = (siteConfig.location_name || '').trim().toLowerCase();
    return area.trim().toLowerCase() === mainCity ? `<strong>${area}</strong>` : area;
  }
  // Output the new card markup
  const serviceAreasHtml = `
<section class="card service-areas-card">
  <h2>Service Areas</h2>
  <div class="service-areas-columns">
    <div class="service-areas-column">
      ${column1.map(area => `<div class="service-area-item">${renderArea(area)}</div>`).join('\n')}
    </div>
    <div class="service-areas-column">
      ${column2.map(area => `<div class="service-area-item">${renderArea(area)}</div>`).join('\n')}
    </div>
  </div>
</section>
`;
  // Replace both the {{service_areas}} and {{service_area}} placeholders
  let result = content.replace(/\{\{service_areas\}\}/g, serviceAreasHtml);
  result = result.replace(/\{\{service_area\}\}/g, serviceAreasHtml);
  return result;
}

// Helper function to process services section
function processServicesSection(siteConfig) {
  if (!siteConfig.services_section || !siteConfig.services_options) {
    return '';
  }
  
  const { title } = siteConfig.services_section;
  
  return `
    <section class="services">
      <h2>${title}</h2>
      <p>Car breakdowns are a hassle, and they never seem to happen at a convenient time. Luckily, our towing services in ${siteConfig.location_name}, ${siteConfig.address.state} are always available to assist you in your time of need. We understand how frustrating it can be to be stuck on the side of the road, so we prioritize getting to you quickly and efficiently.</p>
      <ul class="service-list">
        <li><a href="tow-truck-service.html">Towing Service</a></li>
        <li><a href="emergency-towing.html">Emergency Towing</a></li>
        <li><a href="roadside-assistance.html">Roadside Assistance</a></li>
        <li><a href="auto-wrecking-and-flatbed-towing.html">Auto Wrecking & Flatbed Towing</a></li>
      </ul>
    </section>
  `;
}

// Helper function to process testimonials
function processTestimonials(content, siteConfig) {
  if (!siteConfig.testimonials) return content;
  
  let result = content;
  
  // Get service areas, ensuring we have at least the main city
  const serviceAreas = siteConfig.service_areas || [];
  if (serviceAreas.length === 0) {
    console.error('Error: No service areas found in config');
    return content;
  }

  // Create a copy of testimonials to modify
  const testimonials = JSON.parse(JSON.stringify(siteConfig.testimonials));
  
  // Use the main city as fallback
  const mainCity = siteConfig.location_name;
  
  // Assign cities to testimonials, randomizing and ensuring at least one is the main city
  const testimonialKeys = Object.keys(testimonials);
  // Shuffle a copy of the serviceAreas array
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  let shuffledCities = shuffle(serviceAreas);
  // If there are fewer cities than testimonials, repeat cities
  while (shuffledCities.length < testimonialKeys.length) {
    shuffledCities = shuffledCities.concat(shuffle(serviceAreas));
  }
  // Assign cities
  const assignedCities = shuffledCities.slice(0, testimonialKeys.length);
  // Ensure at least one testimonial uses the main city
  if (!assignedCities.includes(mainCity)) {
    const replaceIdx = Math.floor(Math.random() * assignedCities.length);
    assignedCities[replaceIdx] = mainCity;
  }
  // Debug logging
  console.log('VITE TESTIMONIALS: serviceAreas =', serviceAreas);
  console.log('VITE TESTIMONIALS: assigned cities =', assignedCities);
  testimonialKeys.forEach((key, idx) => {
    testimonials[key].city = assignedCities[idx];
  });

  // Generate testimonials HTML
  const testimonialsHtml = `
    <div class="testimonial-grid">
      ${testimonialKeys.map(key => `
        <div class="testimonial">
          <p class="testimonial-text">${testimonials[key].text}</p>
          <p class="testimonial-meta">— ${testimonials[key].author}, ${testimonials[key].city}, ${testimonials[key].state}</p>
        </div>
      `).join('\n')}
    </div>
  `;

  // Replace testimonials_section placeholder with generated HTML
  result = result.replace('{{testimonials_section}}', testimonialsHtml);
  
  // Process #each blocks in the content
  result = processEachBlocks(result, siteConfig);
  
  // Replace all remaining placeholders in the content
  result = replacePlaceholders(result, siteConfig);
  
  // Replace services section placeholder
  result = result.replace('{{services_section}}', processServicesSection(siteConfig));
  
  // Replace services options placeholder with dynamic options
  if (result.includes('{{services_options}}')) {
    const servicesOptionsHtml = (siteConfig.services_options || []).map(service =>
      `<option value="${service.url.replace('.html', '')}">${service.title}</option>`
    ).join('\n');
    result = result.replace('{{services_options}}', servicesOptionsHtml);
  }
  
  // Process service areas
  result = processServiceAreas(result, siteConfig);
  
  // Remove any duplicate testimonials sections
  result = result.replace(/(<!-- Testimonials Section -->[\s\S]*?<\/section>)[\s\S]*?(<!-- Testimonials Section -->[\s\S]*?<\/section>)/, '$1');
  
  // Validate the result
  const { errors, warnings } = validatePlaceholders(result);
  if (errors.length) {
    console.error('Placeholder validation errors:', errors);
  }
  if (warnings.length) {
    console.warn('Placeholder validation warnings:', warnings);
  }
  
  return result;
}

// Helper function to slugify a string
function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Helper function to replace placeholders
function replacePlaceholders(content, siteConfig) {
  let result = content;
  let lastResult;
  
  // Keep replacing until no more changes are made
  do {
    lastResult = result;
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      // Support filters like {{business.name|slug}}
      const [rawKey, ...filters] = key.trim().split('|');
      let value = getNestedValue(siteConfig, rawKey.trim());
      if (value === undefined) {
        // Special handling for services_options
        if (rawKey.trim() === 'services_options') {
          return (siteConfig.services_options || []).map(service =>
            `<option value="${service.url.replace('.html', '')}">${service.title}</option>`
          ).join('\n');
        }
        console.warn(`Warning: No value found for placeholder ${key}`);
        return match;
      }
      // Apply filters
      for (const filter of filters) {
        if (filter.trim() === 'slug') {
          value = slugify(value);
        } else {
          console.warn(`Warning: Unknown filter |${filter}| on placeholder ${key}`);
        }
      }
      // Don't stringify objects for services_section
      if (rawKey === 'services_section') {
        return processServicesSection(siteConfig);
      }
      // Don't process service_areas here as it's handled separately
      if (rawKey === 'service_areas' || rawKey === 'service_area') {
        return match;
      }
      // Handle footer map URL
      if (rawKey === 'footer_map_embed_url') {
        return value || '';
      }
      // If value is an array and key is services_options, output <option> elements
      if (Array.isArray(value) && rawKey.trim() === 'services_options') {
        return value.map(service =>
          `<option value="${service.url.replace('.html', '')}">${service.title}</option>`
        ).join('\n');
      }
      return typeof value === 'object' ? JSON.stringify(value) : value;
    });
  } while (result !== lastResult);
  
  return result;
}

// Custom plugin to handle HTML processing
function htmlPlugin() {
  return {
    name: 'html-plugin',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.html')) return null;

      // Generate sourcemap
      const map = {
        version: 3,
        sources: [id],
        names: [],
        mappings: 'AAAA;'
      };

      // Process the content
      let content = code;
      // Process all testimonial placeholders
      content = processTestimonials(content, siteConfig);
      // Remove any testimonial placeholders (deprecated)
      content = content.replace(/\{\{(?:testimonials\.)?testimonial[1-3]\.(text|author|city|state)\}\}/g, '');
      // Process service areas and other placeholders
      content = processServiceAreas(content, siteConfig);
      // Replace all other placeholders
      content = replacePlaceholders(content, siteConfig);

      // Validate the result
      const { errors, warnings } = validatePlaceholders(content);
      if (errors.length) {
        console.error('Placeholder validation errors:', errors);
      }
      if (warnings.length) {
        console.warn('Placeholder validation warnings:', warnings);
      }

      return {
        code: content,
        map
      };
    }
  };
}

// Helper: Ensure logo setup is run if needed
function ensureLogoSetup() {
  const configPath = 'site.config.json';
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    throw new Error('Could not read site.config.json');
  }
  if (typeof config.useCityOverlay === 'undefined') {
    console.log('\n--- Logo setup required ---');
    const result = spawnSync('node', ['scripts/setup-logo.js'], { stdio: 'inherit' });
    if (result.status !== 0) {
      throw new Error('Logo setup failed.');
    }
  }
}

// Run logo setup before anything else
ensureLogoSetup();

// Export the Vite configuration
export default defineConfig({
  root: process.cwd(),
  plugins: [
    htmlPlugin(),
    viteStaticCopy({
      targets: [
        { src: 'images/*', dest: 'images' },
        { src: 'css/*', dest: 'css' },
        { src: 'js/*', dest: 'js' },
        { src: 'site.config.json', dest: '.' },
        {
          src: 'public/*',
          dest: '.'
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['sentry-bundle.min.js']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        'tow-truck': 'tow-truck.html',
        'tow-truck-service': 'tow-truck-service.html',
        'car-towing': 'car-towing.html',
        'emergency-towing': 'emergency-towing.html',
        'roadside-assistance': 'roadside-assistance.html',
        'auto-wrecking-and-flatbed-towing': 'auto-wrecking-and-flatbed-towing.html'
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/styles.css';
          }
          return 'assets/[name][extname]';
        },
        chunkFileNames: 'js/[name].js',
        entryFileNames: 'js/[name].js',
      }
    },
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    minify: false,
    sourcemap: true
  },
  server: {
    sourcemapIgnoreList: (sourcePath) => {
      return sourcePath.includes('node_modules') || sourcePath.includes('dist');
    }
  }
}); 