// Function to generate Google Maps embed URL
function generateMapUrl(city, state, lat, lng) {
    // Base URL for Google Maps embed
    const baseUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2800.1234567890123!2d";
    
    // Construct the URL with the provided parameters
    const mapUrl = `${baseUrl}${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52a8c2c2c2c2c2c2%3A0x2c2c2c2c2c2c2c2c!2s${encodeURIComponent(city)}%2C%20${state}!5e0!3m2!1sen!2sus!4v1647881234567!5m2!1sen!2sus`;
    
    return mapUrl;
}

// Function to update the map iframe
function updateMap() {
    const mapIframe = document.querySelector('.footer-map iframe');
    if (mapIframe && window.CONFIG) {
        const { location_name, address, coordinates } = window.CONFIG;
        const mapUrl = generateMapUrl(location_name, address.state, coordinates.lat, coordinates.lng);
        mapIframe.src = mapUrl;
    }
}

// Update map when the page loads
document.addEventListener('config-ready', updateMap); 