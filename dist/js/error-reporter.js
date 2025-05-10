// Custom Error Reporter
window.ErrorReporter = {
    // Store errors in localStorage with a maximum limit
    maxErrors: 100,
    
    // Initialize the error reporter
    init() {
        // Wait for Sentry to be ready
        this.waitForSentry().then(() => {
            // Set up global error handler
            window.addEventListener('error', this.handleError.bind(this));
            window.addEventListener('unhandledrejection', this.handlePromiseError.bind(this));
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Set up form submission monitoring
            this.setupFormMonitoring();
            
            console.log('Custom error reporter initialized');
        }).catch(err => {
            console.warn('Failed to initialize Sentry:', err);
            // Still set up error handlers even if Sentry fails
            window.addEventListener('error', this.handleError.bind(this));
            window.addEventListener('unhandledrejection', this.handlePromiseError.bind(this));
            this.setupPerformanceMonitoring();
            this.setupFormMonitoring();
            console.log('Custom error reporter initialized without Sentry');
        });
    },
    
    // Wait for Sentry to be ready
    waitForSentry() {
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
    },
    
    // Get common metadata for all events
    getCommonMetadata() {
        return {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            location: CONFIG.location_name || '',
            city: (CONFIG.address && CONFIG.address.city) ? CONFIG.address.city : '',
            state: (CONFIG.address && CONFIG.address.state) ? CONFIG.address.state : '',
            business: (CONFIG.business && CONFIG.business.name) ? CONFIG.business.name : '',
        };
    },
    
    // Handle JavaScript errors
    handleError(event) {
        const error = {
            type: 'error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            ...this.getCommonMetadata()
        };
        
        this.storeError(error);
        this.logError(error);
    },
    
    // Handle unhandled promise rejections
    handlePromiseError(event) {
        const error = {
            type: 'promise',
            message: event.reason?.message || 'Unhandled Promise Rejection',
            stack: event.reason?.stack,
            ...this.getCommonMetadata()
        };
        
        this.storeError(error);
        this.logError(error);
    },
    
    // Store error in localStorage
    storeError(error) {
        try {
            let errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
            errors.unshift(error);
            
            // Keep only the most recent errors
            if (errors.length > this.maxErrors) {
                errors = errors.slice(0, this.maxErrors);
            }
            
            localStorage.setItem('errorLog', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to store error:', e);
        }
    },
    
    // Log error to console
    logError(error) {
        if (error.type === 'form_submission_success' || error.type === 'performance') {
            console.info('Event captured:', error);
        } else {
            console.error('Error captured:', error);
        }
    },
    
    // Log success to console
    logSuccess(event) {
        console.info('Success:', event);
    },
    
    // Report success event
    reportSuccess(type, data) {
        const event = {
            type,
            ...data,
            ...this.getCommonMetadata()
        };
        
        // Store but use success logging
        this.storeError(event);
        this.logSuccess(event);
    },
    
    // Get all stored errors
    getErrors() {
        try {
            return JSON.parse(localStorage.getItem('errorLog') || '[]');
        } catch (e) {
            console.error('Failed to retrieve errors:', e);
            return [];
        }
    },
    
    // Clear stored errors
    clearErrors() {
        localStorage.removeItem('errorLog');
    },
    
    // Set up performance monitoring
    setupPerformanceMonitoring() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const timing = window.performance.timing;
                const performance = {
                    type: 'performance',
                    loadTime: timing.loadEventEnd - timing.navigationStart,
                    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstPaint: timing.responseEnd - timing.navigationStart,
                    ...this.getCommonMetadata()
                };
                
                this.storeError(performance);
            });
        }
    },
    
    // Set up form monitoring
    setupFormMonitoring() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                const formData = new FormData(form);
                const formInfo = {
                    type: 'form_submission',
                    formId: form.id,
                    formAction: form.action,
                    ...this.getCommonMetadata()
                };
                
                this.storeError(formInfo);
            });
        });
    },
    
    // Report custom event
    reportEvent(type, data) {
        const event = {
            type,
            ...data,
            ...this.getCommonMetadata()
        };
        
        this.storeError(event);
        this.logError(event);
    }
};

// Initialize the error reporter
window.ErrorReporter.init();

document.addEventListener('config-ready', function() {
    // ... all code that uses CONFIG, e.g.:
    // - getCommonMetadata
    // - error reporting
    // - any other code that references CONFIG.location, CONFIG.address, etc.
    // ... existing code ...
}); 