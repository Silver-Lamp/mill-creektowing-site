import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the site config
const configPath = path.join(__dirname, '..', 'site.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Function to clean city name
function cleanCityName(name) {
    // Remove "Town of" and similar prefixes
    name = name.replace(/^(Town of|City of|Village of)\s+/i, '');
    // Remove any directional prefixes (North, South, East, West)
    name = name.replace(/^(North|South|East|West)\s+/i, '');
    return name;
}

// Function to get cities within radius
async function getCitiesInRadius(lat, lng, radiusMiles) {
    try {
        console.log(`Searching for cities within ${radiusMiles} miles of coordinates: ${lat}, ${lng}`);
        
        // Using OpenStreetMap Overpass API to get cities
        const query = `
            [out:json][timeout:25];
            area["name:en"="United States"]->.usa;
            (
              node["place"="city"](around:${radiusMiles * 1609.34},${lat},${lng});
              node["place"="town"](around:${radiusMiles * 1609.34},${lat},${lng});
            );
            out body;
            >;
            out skel qt;
        `;

        console.log('Querying OpenStreetMap API...');
        const response = await axios.post('https://overpass-api.de/api/interpreter', query);
        console.log(`Received ${response.data.elements.length} locations from API`);

        const cities = new Map(); // Use Map to handle duplicates

        response.data.elements.forEach(element => {
            if (element.tags && element.tags.name) {
                const originalName = element.tags.name;
                const cleanedName = cleanCityName(originalName);
                
                // Skip if name is too short or contains unwanted terms
                if (cleanedName.length < 3 || 
                    cleanedName.toLowerCase().includes('town of') ||
                    cleanedName.toLowerCase().includes('village of') ||
                    cleanedName.toLowerCase().includes('city of')) {
                    return;
                }

                // Store the original name if we haven't seen this city before
                if (!cities.has(cleanedName)) {
                    cities.set(cleanedName, originalName);
                }
            }
        });

        console.log(`Found ${cities.size} unique cities after cleaning`);
        return Array.from(cities.values()).sort();
    } catch (error) {
        console.error('Error fetching cities:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return [];
    }
}

// Main function to update service areas
async function updateServiceAreas() {
    const baseLat = parseFloat(config.coordinates.lat);
    const baseLng = parseFloat(config.coordinates.lng);
    const radiusMiles = 45; // 45-minute driving radius (approximately 45 miles)

    console.log(`Finding cities within ${radiusMiles} miles of ${config.location_name}...`);
    
    const cities = await getCitiesInRadius(baseLat, baseLng, radiusMiles);
    
    if (cities.length > 0) {
        // Update the config
        config.service_areas = cities;
        
        // Write back to file
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`\nUpdated service areas with ${cities.length} cities:`);
        console.log(cities.join('\n'));
    } else {
        console.error('No cities found within radius');
    }
}

// Run the update
updateServiceAreas().catch(console.error); 