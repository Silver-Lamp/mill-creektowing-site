const fs = require('fs');
const path = require('path');

// Read the configuration file
const configPath = path.join(__dirname, '..', 'site.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Helper to get nested value from config using dot notation
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
}

// Function to process HTML files
function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace all {{...}} placeholders
    content = content.replace(/{{\s*([\w.]+)\s*}}/g, (match, keyPath) => {
        // Special handling for service_area_N
        const serviceAreaMatch = keyPath.match(/^service_area_(\d+)$/);
        if (serviceAreaMatch) {
            const idx = parseInt(serviceAreaMatch[1], 10) - 1; // Convert to 0-based index
            // Deduplicate service areas, keeping the first occurrence
            const serviceAreas = Array.from(new Set((config.service_areas || []).map(area => area.trim())));
            const value = serviceAreas[idx] || '';
            console.log(`[DEBUG] Replacing {{${keyPath}}} with:`, value);
            return value;
        }

        // Special handling for service_areas
        if (keyPath === 'service_areas' || keyPath === 'service_area') {
            // Deduplicate service areas, keeping the first occurrence
            const serviceAreas = Array.from(new Set((config.service_areas || []).map(area => area.trim())));
            const value = serviceAreas.join(', ');
            console.log(`[DEBUG] Replacing {{${keyPath}}} with:`, value);
            return value;
        }

        const value = getNestedValue(config, keyPath);
        console.log(`[DEBUG] Replacing {{${keyPath}}} with:`, value);
        return value !== undefined ? value : '';
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

// Process all HTML files in the dist directory
const distDir = path.join(__dirname, '..', 'dist');
const htmlFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    processHtmlFile(filePath);
    console.log(`Processed ${file}`);
});

console.log('All HTML files have been processed.'); 