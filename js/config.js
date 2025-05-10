// Location-specific configuration
window.CONFIG = window.CONFIG || {};

// Load configuration from site.config.json
fetch('site.config.json')
    .then(response => response.json())
    .then(config => {
        Object.assign(window.CONFIG, config);

        // Generate dynamic map URL
        if (config.coordinates && config.location_name && config.address) {
            const lat = parseFloat(config.coordinates.lat);
            const lng = parseFloat(config.coordinates.lng);
            const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2800.1234567890123!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52a8c2c2c2c2c2c2%3A0x2c2c2c2c2c2c2c2c!2s${encodeURIComponent(config.location_name)}%2C%20${config.address.state}!5e0!3m2!1sen!2sus!4v1647881234567!5m2!1sen!2sus`;
            console.log('CONFIG loaded:', config);
            console.log('lat:', lat, 'lng:', lng, 'mapUrl:', mapUrl);
            const mapIframe = document.querySelector('.footer-map iframe');
            if (mapIframe) {
                mapIframe.src = mapUrl;
            }
        }

        // Dispatch event so other scripts can safely use CONFIG
        document.dispatchEvent(new Event('config-ready'));
    })
    .catch(error => console.error('Error loading configuration:', error)); 