// Schema data for JSON-LD
function getSchemaData() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "{{business.name}}",
    "image": "https://yourdomain.com/images/logo.png",
    "url": `https://yourdomain.com/${currentPage}`,
    "telephone": "{{phone_number}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{address.street}}",
      "addressLocality": "{{location_name}}",
      "addressRegion": "{{address.state}}",
      "postalCode": "{{address.zip}}",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "{{coordinates.lat}}",
      "longitude": "{{coordinates.lng}}"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "sameAs": [
      "https://www.facebook.com/{{business.name}}",
      "https://twitter.com/{{business.name}}"
    ]
  };
}

// Function to initialize schema
function initSchema() {
  const schemaScript = document.getElementById('schema-markup');
  if (schemaScript) {
    schemaScript.textContent = JSON.stringify(getSchemaData(), null, 2);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSchema); 