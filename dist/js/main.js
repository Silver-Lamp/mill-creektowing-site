// Wait for Sentry to be ready
function waitForSentry() {
    return new Promise((resolve, reject) => {
        if (typeof Sentry !== 'undefined') {
            resolve();
        } else {
            // Check every 100ms for up to 5 seconds
            let attempts = 0;
            const maxAttempts = 50;
            const interval = setInterval(() => {
                attempts++;
                if (typeof Sentry !== 'undefined') {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Sentry failed to load after 5 seconds'));
                }
            }, 100);
        }
    });
}

// Initialize Sentry and start monitoring
let transaction = null;

waitForSentry().then(() => {
    // Initialize Sentry performance monitoring
    transaction = Sentry.startTransaction({
        name: "Page Load",
        op: "pageload"
    });

    // Track page load performance
    window.addEventListener('load', () => {
        if (transaction) {
            transaction.finish();
        }
    });
}).catch(err => {
    console.error('Sentry is not loaded. Using custom error reporter.');
    ErrorReporter.reportEvent('sentry_unavailable', {
        message: 'Sentry failed to load'
    });
});

// Track image load errors
function handleImageLoadError(img) {
    img.onerror = null;
    img.src = 'images/placeholder.jpg';
    
    // Report to both Sentry and custom reporter
    if (typeof Sentry !== 'undefined') {
        Sentry.withScope(function(scope) {
            scope.setTag('errorType', 'image_load');
            scope.setExtra('imageSrc', img.src);
            scope.setExtra('imageAlt', img.alt);
            Sentry.captureMessage('Image failed to load', 'warning');
        });
    }
    
    ErrorReporter.reportEvent('image_load_error', {
        imageSrc: img.src,
        imageAlt: img.alt
    });
}

// Initialize animations with error tracking
document.addEventListener('DOMContentLoaded', function() {
    try {
        const animatedElements = document.querySelectorAll('[data-anim-desktop]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.visibility = 'visible';
                    observer.unobserve(entry.target);
                }
            });
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    } catch (error) {
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(error, {
                tags: {
                    errorType: 'animation_initialization'
                }
            });
        }
        ErrorReporter.reportEvent('animation_error', {
            error: error.message,
            stack: error.stack
        });
        console.error('Animation initialization error:', error);
    }
});

// Make entire service-list li clickable with error tracking
window.addEventListener('DOMContentLoaded', function() {
    try {
        document.querySelectorAll('.service-list li').forEach(function(li) {
            li.addEventListener('click', function(e) {
                var link = li.querySelector('a');
                if (link) {
                    window.location = link.href;
                }
            });
            li.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    var link = li.querySelector('a');
                    if (link) {
                        window.location = link.href;
                    }
                }
            });
            li.tabIndex = 0;
            li.setAttribute('role', 'button');
            li.setAttribute('aria-label', li.textContent.trim());
        });
    } catch (error) {
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(error, {
                tags: {
                    errorType: 'service_list_interaction'
                }
            });
        }
        ErrorReporter.reportEvent('service_list_error', {
            error: error.message,
            stack: error.stack
        });
        console.error('Service list interaction error:', error);
    }
});

// Form submission with enhanced error tracking
document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('.form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Start a transaction for form submission if Sentry is available
            let formTransaction;
            if (typeof Sentry !== 'undefined') {
                formTransaction = Sentry.startTransaction({
                    name: "Form Submission",
                    op: "form.submit",
                    tags: {
                        location: CONFIG.location_name,
                        city: CONFIG.address.city,
                        state: CONFIG.address.state
                    }
                });
            }
            
            // Disable submit button and show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            var name = document.getElementById('name').value;
            var email = document.getElementById('email').value;
            var phone = document.getElementById('phone').value;
            var service = document.getElementById('service').value;

            // Log form submission attempt
            console.log('Form submission attempt:', {
                timestamp: new Date().toISOString(),
                formData: { name, email, phone, service },
                userAgent: navigator.userAgent,
                url: window.location.href,
                location: CONFIG.location_name
            });

            // Validate inputs
            if (!name || !email || !phone || !service) {
                console.warn('Form validation failed:', {
                    missingFields: {
                        name: !name,
                        email: !email,
                        phone: !phone,
                        service: !service
                    },
                    location: CONFIG.location_name
                });
                
                // Report validation failure to both systems
                if (typeof Sentry !== 'undefined') {
                    Sentry.withScope(function(scope) {
                        scope.setLevel('warning');
                        scope.setTag('type', 'form_validation');
                        scope.setTag('location', CONFIG.location_name);
                        scope.setExtra('missingFields', {
                            name: !name,
                            email: !email,
                            phone: !phone,
                            service: !service
                        });
                        Sentry.captureMessage('Form validation failed', 'warning');
                    });
                }
                
                alert('Please fill in all required fields.');
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                if (formTransaction) formTransaction.finish();
                return;
            }

            // Add to Firestore with error handling
            db.collection('contacts').add({
                name: name,
                email: email,
                phone: phone,
                service: service,
                location: CONFIG.location_name,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    locationData: {
                        name: CONFIG.location_name,
                        city: CONFIG.address.city,
                        state: CONFIG.address.state
                    }
                }
            }).then(function(docRef) {
                console.info('Form submission success:', {
                    type: 'form_submission_success',
                    documentId: docRef.id,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    location: CONFIG.location_name
                });
                
                // Only report to Sentry for tracking purposes
                if (typeof Sentry !== 'undefined') {
                    Sentry.withScope(function(scope) {
                        scope.setLevel('info');
                        scope.setTag('type', 'form_success');
                        scope.setTag('location', CONFIG.location_name);
                        scope.setExtra('documentId', docRef.id);
                        Sentry.captureMessage('Form submitted successfully', 'info');
                    });
                }
                
                alert('Thank you! Your message has been sent.');
                form.reset();
            }).catch(function(error) {
                // Detailed error logging
                console.error('Firebase error details:', {
                    errorCode: error.code,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    timestamp: new Date().toISOString(),
                    formData: { name, email, phone, service },
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    location: CONFIG.location_name
                });

                // Report to Sentry
                if (typeof Sentry !== 'undefined') {
                    Sentry.withScope(function(scope) {
                        scope.setExtra('formData', {
                            name: name,
                            email: email,
                            phone: phone,
                            service: service
                        });
                        scope.setExtra('userAgent', navigator.userAgent);
                        scope.setExtra('url', window.location.href);
                        scope.setTag('type', 'form_submission_error');
                        scope.setTag('location', CONFIG.location_name);
                        scope.setTag('errorCode', error.code);
                        Sentry.captureException(error);
                    });
                }

                // Show user-friendly error message
                if (error.code === 'permission-denied') {
                    console.error('Firebase permissions error:', {
                        error: error,
                        timestamp: new Date().toISOString(),
                        location: CONFIG.location_name
                    });
                    alert(`Sorry, there was an error submitting your form. Please try again or call us directly at ${CONFIG.phone_number}.`);
                } else if (error.code === 'unavailable') {
                    console.error('Firebase service unavailable:', {
                        error: error,
                        timestamp: new Date().toISOString(),
                        location: CONFIG.location_name
                    });
                    alert(`Sorry, our service is temporarily unavailable. Please try again in a few minutes or call us directly at ${CONFIG.phone_number}.`);
                } else {
                    console.error('Unexpected Firebase error:', {
                        error: error,
                        timestamp: new Date().toISOString(),
                        location: CONFIG.location_name
                    });
                    alert('Sorry, there was an error: ' + error.message);
                }
            }).finally(function() {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                if (formTransaction) formTransaction.finish();
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
  // Phone input masking (US format: (123) 456-7890)
  var phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let x = e.target.value.replace(/\D/g, '').substring(0,10);
      let formatted = '';
      if (x.length > 6) {
        formatted = `(${x.substring(0,3)}) ${x.substring(3,6)}-${x.substring(6,10)}`;
      } else if (x.length > 3) {
        formatted = `(${x.substring(0,3)}) ${x.substring(3,6)}`;
      } else if (x.length > 0) {
        formatted = `(${x}`;
      }
      e.target.value = formatted;
    });
  }

  // Email stricter validation on blur
  var emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', function(e) {
      var value = e.target.value;
      var valid = /^[^@]+@[^@]+\.[^@]+$/.test(value);
      if (!valid && value.length > 0) {
        alert('Please enter a valid email address.');
        e.target.focus();
      }
    });
  }
}); 

document.addEventListener('config-ready', function() {
    // ... all code that uses CONFIG, e.g.:
    // - form submission handler
    // - any Sentry tags that use CONFIG
    // - any other code that references CONFIG.location_name, CONFIG.address, etc.
    // ... existing code ...
}); 