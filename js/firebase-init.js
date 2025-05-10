// Firebase App (the core Firebase SDK) is required and must be loaded before this file.
// Add this file after loading the Firebase SDKs in your HTML.

document.addEventListener('config-ready', function() {
  try {
    // Initialize Firebase using configuration from config.js
    firebase.initializeApp(CONFIG.firebase);
    
    // Initialize Firestore
    const db = firebase.firestore();
    window.db = db;
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      });

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}); 