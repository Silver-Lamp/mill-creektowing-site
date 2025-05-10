// generate-service-areas.js
// Usage: node generate-service-areas.js path/to/config.json
// Requires: npm install node-fetch
// This version uses the OpenStreetMap Overpass API (no API key required)

import fetch from 'node-fetch';
import fs from 'fs/promises';
import inquirer from 'inquirer';

if (process.argv.length < 3) {
  console.error('Usage: node generate-service-areas.js path/to/config.json');
  process.exit(1);
}

const configPath = process.argv[2];
const RADIUS_METERS = 48280; // ~30 miles

async function getNearbyCities(lat, lng, radius) {
  // Overpass QL query for cities, towns, villages within radius
  const query = `
    [out:json][timeout:25];
    (
      node[place~"city|town|village"](around:${radius},${lat},${lng});
    );
    out body;
  `;
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  });
  const data = await res.json();
  if (!data.elements) return [];
  // Extract unique names and filter out "Town of" prefixes
  const cities = Array.from(new Set(
    data.elements
      .map(e => e.tags && e.tags.name)
      .filter(Boolean)
      .filter(name => !name.startsWith('Town of'))
  ));
  return cities;
}

// Example service areas for template
const serviceAreas = [
  "{{location_name}}",
  "Nearby City 1",
  "Nearby City 2",
  "Nearby City 3"
];

(async () => {
  try {
    const configRaw = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configRaw);
    const { lat, lng } = config.coordinates;
    const cities = await getNearbyCities(lat, lng, RADIUS_METERS);
    if (!cities.length) {
      console.warn('No cities found. Keeping existing service_areas.');
      return;
    }

    // Skip interactive review if SKIP_SERVICE_AREAS_PROMPT is set
    if (process.env.SKIP_SERVICE_AREAS_PROMPT) {
      // Use the first 10 cities or all if less than 10
      config.service_areas = cities.slice(0, 10);
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log('Auto-selected service_areas:', config.service_areas);
      return;
    }

    // Interactive review step
    const { selectedCities } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedCities',
        message: 'Select which cities to include in service_areas:',
        choices: cities.map(city => ({ name: city, checked: true }))
      }
    ]);
    config.service_areas = selectedCities;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('Updated service_areas:', selectedCities);
  } catch (err) {
    console.error('Failed to update service_areas:', err);
  }
})(); 