const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const city = 'Milton';
const state = 'WI';
const businessName = 'Milton Towing';
const phone = '555-000-0000';
const citySlug = city.toLowerCase().replace(/\s+/g, '-');
const repoName = `${citySlug}towing-site`;
const newDir = path.resolve('..', repoName);

describe('generate-complete-city-site', () => {
  beforeAll(() => {
    // Clean up any previous test output
    if (fs.existsSync(newDir)) {
      fs.rmSync(newDir, { recursive: true, force: true });
    }
    // Run the generator script
    execSync(
      `node generate-complete-city-site.js --city "${city}" --state "${state}" --business-name "${businessName}" --phone "${phone}"`,
      { stdio: 'inherit' }
    );
  }, 120000); // Allow up to 2 minutes for site generation

  it('should include non-blank, real testimonial city names in the HTML output', () => {
    const configPath = path.join(newDir, 'site.config.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const testimonialCities = [
      config.testimonials.testimonial1.city,
      config.testimonials.testimonial2.city,
      config.testimonials.testimonial3.city,
    ];

    // 1. No city should be blank
    testimonialCities.forEach(cityName => {
      expect(cityName).toBeTruthy();
      expect(cityName).not.toMatch(/^\s*$/);
    });

    // 2. At least one city should be different from the main city
    const mainCity = config.service_areas[0];
    const uniqueCities = new Set(testimonialCities);
    expect(uniqueCities.size).toBeGreaterThan(1);

    // 3. All testimonial cities should be in the service_areas list
    testimonialCities.forEach(cityName => {
      expect(config.service_areas).toContain(cityName);
    });

    // 4. All testimonial cities should appear in the HTML
    const distPath = path.join(newDir, 'dist');
    const htmlFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.html'));
    expect(htmlFiles.length).toBeGreaterThan(0);

    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(distPath, file), 'utf8');
      for (const testimonialCity of testimonialCities) {
        expect(content).toContain(testimonialCity);
      }
    }
  });
}); 