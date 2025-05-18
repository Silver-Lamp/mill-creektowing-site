const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const DEBUG = process.env.DEBUG === '1';

// Read the configuration file
const configPath = path.join(__dirname, '..', 'site.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Helper to get all keys in the config (dot notation)
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return keys;
}

// Helper to get nested value from config using dot notation and array indices
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => {
        if (key.match(/^[0-9]+$/)) {
            return Array.isArray(acc) ? acc[parseInt(key, 10)] : undefined;
        }
        return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
}

// Apply filters like |upper, |lower, |slug
function applyFilters(value, filters) {
    if (typeof value !== 'string') return value;
    for (const filter of filters) {
        if (filter === 'upper') value = value.toUpperCase();
        else if (filter === 'lower') value = value.toLowerCase();
        else if (filter === 'slug') value = value.replace(/\s+/g, '-').toLowerCase();
    }
    return value;
}

// Recursively replace placeholders in a string
function replacePlaceholders(str, config, depth = 0, currentPage = null) {
    if (DEBUG) {
      if (str.includes('{{service_areas}}')) {
        console.log('[DEBUG] Found {{service_areas}} in HTML before replacement');
      }
    }
    if (depth > 5) return str; // Prevent infinite recursion
    // Extract current_page if present at the top
    if (!currentPage) {
        const match = str.match(/^\{\{current_page\}\}=(.+)\n/);
        if (match) {
            currentPage = JSON.parse(match[1]);
            str = str.replace(/^\{\{current_page\}\}=.+\n/, '');
        }
    }
    // Replace nested placeholders like pages.{{current_page}}.about_heading
    str = str.replace(/\{\{pages\.\{\{current_page\}\}\.([\w_]+)\}\}/g, (m, key) => {
        if (currentPage && config.pages && config.pages[currentPage] && config.pages[currentPage][key]) {
            return config.pages[currentPage][key];
        }
        // Fail the build if a per-page value is missing
        console.error(`\n[ERROR] Missing per-page value: pages.${currentPage}.${key}\n`);
        process.exit(1);
    });
    const replaced = str.replace(/{{\s*([\w.]+)(\|[\w|]+)?\s*}}/g, (match, keyPath, filterStr) => {
        keyPath = keyPath.trim();
        let filters = [];
        if (filterStr) {
            filters = filterStr.split('|').slice(1); // Remove leading empty string
        }
        if (keyPath === 'testimonials_section') {
          // Skip replacing this placeholder so Vite's generated HTML remains
          return match;
        }
        if (keyPath === 'services_buttons') {
            if (Array.isArray(config.services_options)) {
                return config.services_options.map(service =>
                    `<a href="${service.url}" class="service-btn">${service.title}</a>`
                ).join('\n');
            }
            return '';
        }
        if (keyPath === 'about_links_rendered') {
            const page = currentPage || 'auto-wrecking-and-flatbed-towing';
            const links = (config.pages && config.pages[page] && config.pages[page].about_links) || [];
            return links.map(l => `<a href="${l.url}">${l.label}</a>`).join(' | ');
        }
        let value = getNestedValue(config, keyPath);
        if (value === undefined) {
            console.warn(`[WARN] No value found for placeholder: ${keyPath}`);
            if (DEBUG) {
              console.warn(`[DEBUG] Available config keys:`, getAllKeys(config));
            }
            return '';
        }
        if (Array.isArray(value)) {
            if (keyPath === 'service_areas') {
                if (DEBUG) {
                  console.log(`[DEBUG] Replacing {{service_areas}} on page: ${currentPage} with value:`, value);
                }
                // Two-column layout
                const areas = value;
                const mainCity = (config.location_name || '').trim().toLowerCase();
                // Alphabetize all cities (including the main city)
                const sortedAreas = [...areas].sort((a, b) => a.localeCompare(b));
                const rows = Math.ceil(sortedAreas.length / 2);
                const column1 = [];
                const column2 = [];
                for (let i = 0; i < rows; i++) {
                    if (sortedAreas[i]) column1.push(sortedAreas[i]);
                    if (sortedAreas[i + rows]) column2.push(sortedAreas[i + rows]);
                }
                function renderArea(area) {
                    return area.trim().toLowerCase() === mainCity ? `<strong>${area}</strong>` : area;
                }
                const html = `
<section class="card service-areas-card">
  <h2>Service Areas</h2>
  <div class="service-areas-columns">
    <div class="service-areas-column">
      ${column1.map(renderArea).map(a => `<div>${a}</div>`).join('\n')}
    </div>
    <div class="service-areas-column">
      ${column2.map(renderArea).map(a => `<div>${a}</div>`).join('\n')}
    </div>
  </div>
</section>
`;
                if (DEBUG) {
                  console.log('[DEBUG] Service Areas HTML:', html);
                  fs.writeFileSync('service-areas-debug.html', html, 'utf8');
                }
                return html;
            }
            if (keyPath === 'about_services_list') {
                // Render as <li> elements for the about section
                return value.map(item => `<li>${item}</li>`).join('\n');
            }
            // Default: Expand array into HTML list
            const listItems = value.map(item => `<li>${item}</li>`).join('\n');
            return `<ul>${listItems}</ul>`;
        }
        if (DEBUG) {
          console.log(`[DEBUG] Replacing {{${keyPath}}} with:`, value);
        }
        value = applyFilters(value, filters);
        if (typeof value === 'string' && value.includes('{{')) {
            value = replacePlaceholders(value, config, depth + 1, currentPage);
        }
        return value;
    });
    if (DEBUG) {
      if (replaced.includes('{{service_areas}}')) {
        console.log('[DEBUG] {{service_areas}} still present in HTML after replacement');
      } else {
        console.log('[DEBUG] {{service_areas}} replaced in HTML');
      }
    }
    return replaced;
}

// Recursively process all HTML files in a directory
function processHtmlFiles(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const filePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processHtmlFiles(filePath);
        } else if (entry.name.endsWith('.html')) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Extract per-page config block if present
            let perPageConfig = {};
            const pageConfigMatch = content.match(/<script type="application\/json" id="page-config">([\s\S]*?)<\/script>/);
            if (pageConfigMatch) {
                try {
                    perPageConfig = JSON.parse(pageConfigMatch[1]);
                    if (DEBUG) {
                        console.log(`[DEBUG] Per-page config for ${filePath}:`, perPageConfig);
                    }
                } catch (e) {
                    console.error(`[ERROR] Failed to parse per-page config in ${filePath}:`, e);
                }
                // Remove the script block from the HTML
                content = content.replace(pageConfigMatch[0], '');
            }
            // Merge per-page config into global config (per-page takes precedence, but only if not null/undefined/empty)
            const mergedConfig = { ...config };
            for (const key in perPageConfig) {
                const val = perPageConfig[key];
                if (
                  val !== undefined &&
                  val !== null &&
                  !(Array.isArray(val) && val.length === 0) &&
                  !(typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)
                ) {
                  mergedConfig[key] = val;
                }
            }
            if (DEBUG) {
              console.log(`[DEBUG] mergedConfig for ${filePath}:`, JSON.stringify(mergedConfig, null, 2));
              console.log(`[DEBUG] service_areas for ${filePath}:`, mergedConfig.service_areas);
            }
            content = replacePlaceholders(content, mergedConfig);
            // Determine template number for version marker
            let templateNum = '';
            if (config && config.templateStyle) {
              templateNum = config.templateStyle === 'template2' ? 'T2' : 'T1';
            } else if (process.env.TEMPLATE_STYLE) {
              templateNum = process.env.TEMPLATE_STYLE === 'template2' ? 'T2' : 'T1';
            } else {
              templateNum = 'T?';
            }
            const versionString = `${buildTime} | ${gitHash} | ${templateNum}`;
            const versionDiv = `<div style="opacity:0.18;font-size:10px;pointer-events:none;">${versionString}</div>`;
            // Prefer to inject before </footer> if present, else before </body>
            if (content.includes('</footer>')) {
              content = content.replace('</footer>', `${versionDiv}\n</footer>`);
            } else if (content.includes('</body>')) {
              content = content.replace('</body>', `${versionDiv}\n</body>`);
            } else {
              content += `\n${versionDiv}`;
            }
            // Inject meta tag with version into <head>
            const metaTag = `<meta name=\"site-build-version\" content=\"${versionString}\">`;
            if (content.includes('</head>')) {
              content = content.replace('</head>', `${metaTag}\n</head>`);
            } else {
              content = `${metaTag}\n` + content;
            }
            fs.writeFileSync(filePath, content, 'utf8');
            if (DEBUG) {
              console.log(`[DEBUG] Processed ${filePath}`);
            } else {
              console.log(`Processed ${filePath}`);
            }
        }
    });
}

// --- VERSION MARKER SETUP ---
let gitHash = '';
try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  gitHash = 'nogit';
}
const buildTime = new Date().toISOString();

if (DEBUG) {
  console.log('[DEBUG] Config keys:', getAllKeys(config));
}

// Accept optional directory argument
const targetDir = process.argv[2] || path.join(__dirname, '..', 'dist');
processHtmlFiles(targetDir);

console.log('All HTML files have been processed.'); 