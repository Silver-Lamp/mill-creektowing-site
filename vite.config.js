import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';
import { generateDefaultLogo } from './scripts/generate-logo.js';
import { spawnSync } from 'child_process';

// Read site config
const siteConfig = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));

// Read testimonials template
const testimonialsTemplate = fs.readFileSync('templates/testimonials.html', 'utf8');

// Helper function to get nested value
function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
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
  console.log('Processing service areas:', areas);
  
  if (!areas || !Array.isArray(areas)) {
    console.error('Error: No service areas found in config');
    return content;
  }
  
  // Deduplicate service areas, keeping first occurrence (case-insensitive)
  const dedupedAreas = Array.from(new Set(areas.map(area => area.trim().toLowerCase())))
    .map(lower => areas.find(area => area.trim().toLowerCase() === lower));

  // Alphabetize all cities (including the main city)
  const sortedAreas = [...dedupedAreas].sort((a, b) => a.localeCompare(b));
  console.log('Sorted service areas:', sortedAreas);
  
  // Fill columns row-wise for top-to-bottom, left-to-right order
  const rows = Math.ceil(sortedAreas.length / 2);
  const column1 = [];
  const column2 = [];
  for (let i = 0; i < rows; i++) {
    if (sortedAreas[i]) column1.push(sortedAreas[i]);
    if (sortedAreas[i + rows]) column2.push(sortedAreas[i + rows]);
  }
  console.log('Column 1:', column1);
  console.log('Column 2:', column2);
  
  // Bold the main city (case-insensitive, trimmed)
  function renderArea(area) {
    const mainCity = (siteConfig.location_name || '').trim().toLowerCase();
    return area.trim().toLowerCase() === mainCity ? `<strong>${area}</strong>` : area;
  }
  
  const serviceAreasHtml = `
    <div class="service-areas-columns">
      <div class="service-areas-column">
        ${column1.map(area => `<div class=\"service-area-item\">${renderArea(area)}</div>`).join('\n')}
      </div>
      <div class="service-areas-column">
        ${column2.map(area => `<div class=\"service-area-item\">${renderArea(area)}</div>`).join('\n')}
      </div>
    </div>
  `;
  
  // Replace both the {{service_areas}} and {{service_area}} placeholders
  let result = content.replace(/\{\{service_areas\}\}/g, serviceAreasHtml);
  result = result.replace(/\{\{service_area\}\}/g, serviceAreasHtml);
  
  // Don't remove #each blocks for service areas in list format
  if (!content.includes('{{#each service_areas}}<li>') && !content.includes('{{#each service_area}}<li>')) {
    result = result.replace(/#each\s+service_areas?[\s\S]*?\/each/g, '');
  }
  
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

  // Replace testimonial placeholders with and without 'testimonials.' prefix
  result = result.replace(/\{\{(?:testimonials\.)?testimonial([1-3])\.(text|author|city|state)\}\}/g, (match, num, field) => {
    const testimonial = testimonials[`testimonial${num}`];
    if (!testimonial || !testimonial[field]) {
      console.error(`Error: Missing testimonial data for testimonial${num}.${field}`);
      return '';
    }
    return testimonial[field];
  });
  
  // Process #each blocks in the content
  result = processEachBlocks(result, siteConfig);
  
  // Replace all remaining placeholders in the content
  result = replacePlaceholders(result, siteConfig);
  
  // Replace services section placeholder
  result = result.replace('{{services_section}}', processServicesSection(siteConfig));
  
  // Replace services options placeholder with dynamic options (guaranteed)
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
  
  // Final guarantee: replace any remaining {{services_options}} with <option> elements
  result = result.replace(/\{\{services_options\}\}/g, (siteConfig.services_options || []).map(service =>
    `<option value="${service.url.replace('.html', '')}">${service.title}</option>`
  ).join('\n'));
  
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
    async buildStart() {
      // Always generate the default logo (logo.png and logo.webp)
      // try {
      //   await generateDefaultLogo(siteConfig.location_name, 'images');
      // } catch (error) {
      //   console.error('Error handling logo:', error);
      // }

      // Process HTML files
      const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));
      for (const file of htmlFiles) {
        // Reload site.config.json for each file to ensure latest data
        const siteConfig = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
        let content = fs.readFileSync(file, 'utf8');
        if (file === 'index.html') {
          // Inject the raw testimonials template if needed
          if (content.includes('{{testimonials_section}}')) {
            content = content.replace('{{testimonials_section}}', testimonialsTemplate);
          }
          // Now process all testimonial placeholders (randomizing cities) in the whole file
          const processedContent = processTestimonials(content, siteConfig);
          fs.writeFileSync(file, processedContent);
        } else {
          // Remove testimonials section from all other pages
          if (content.includes('{{testimonials_section}}')) {
            content = content.replace('{{testimonials_section}}', '');
          }
          // Remove any testimonial placeholders
          content = content.replace(/\{\{(?:testimonials\.)?testimonial[1-3]\.(text|author|city|state)\}\}/g, '');
          // Remove service areas section and placeholders
          content = content.replace(/<section[^>]*class=["'][^"']*service-areas[^"']*["'][\s\S]*?<\/section>/gi, '');
          content = content.replace(/\{\{service_areas\}\}/g, '');
          content = content.replace(/\{\{service_area\}\}/g, '');
          // Replace all other placeholders (business/city/state/phone/etc)
          content = replacePlaceholders(content, siteConfig);
          // Always replace {{services_options}} with <option> elements
          if (content.includes('{{services_options}}')) {
            const servicesOptionsHtml = siteConfig.services_options.map(service => `
              <option value="${service.url.replace('.html', '')}">${service.title}</option>
            `).join('\n');
            content = content.replace('{{services_options}}', servicesOptionsHtml);
          }
          fs.writeFileSync(file, content);
        }
      }
    },
    transform(code, id) {
      if (id.endsWith('.html')) {
        // Process testimonials first
        let result = processTestimonials(code, siteConfig);
        
        // Process script tags
        result = result.replace(/<script([^>]*)>/g, (match, attrs) => {
          // Remove any existing type, async, or defer attributes
          attrs = attrs.replace(/\s+(type|async|defer)=["'][^"']*["']/g, '');
          
          // Handle different types of scripts
          if (attrs.includes('application/ld+json')) {
            return `<script type="application/ld+json"${attrs}>`;
          }
          if (attrs.includes('src=')) {
            // External scripts should be async
            return `<script type="module" async${attrs}>`;
          }
          // Inline scripts should be modules
          return `<script type="module"${attrs}>`;
        });
        
        // Process JSON-LD schema
        result = result.replace(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g, (match, schema) => {
          try {
            let schemaData = JSON.parse(schema);
            // Replace placeholders in schema
            schemaData = JSON.parse(replacePlaceholders(JSON.stringify(schemaData), siteConfig));
            return `<script type="application/ld+json">${JSON.stringify(schemaData, null, 2)}</script>`;
          } catch (err) {
            console.warn('Warning: Failed to process JSON-LD schema:', err.message);
            return match;
          }
        });
        
        return result;
      }
      return code;
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
export default ({ command }) => ({
  root: command === 'serve' ? 'dist' : process.cwd(), // Serve from 'dist' in dev, root in build
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
        manualChunks: undefined,
        assetFileNames: '[name].[ext]',
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
        // sourcemapBaseUrl: 'http://localhost:5173/' // Commented out to prevent dev source map errors
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