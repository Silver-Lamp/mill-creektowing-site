document.addEventListener("config-ready", function() {
  try {
    firebase.initializeApp(CONFIG.firebase);
    const db = firebase.firestore();
    window.db = db;
    db.enablePersistence().catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === "unimplemented") {
        console.warn("The current browser does not support persistence.");
      }
    });
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
});
(function() {
  var hamburger = document.querySelector(".hamburger");
  var mobileNav = document.getElementById("mobile-nav");
  if (hamburger && mobileNav) {
    let updateHamburgerDisplay2 = function() {
      if (window.innerWidth <= 900) {
        hamburger.style.display = "block";
      } else {
        hamburger.style.display = "none";
        mobileNav.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      }
    };
    var updateHamburgerDisplay = updateHamburgerDisplay2;
    updateHamburgerDisplay2();
    window.addEventListener("resize", updateHamburgerDisplay2);
    hamburger.addEventListener("click", function() {
      var expanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !expanded);
      mobileNav.classList.toggle("open", !expanded);
    });
  } else {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.log("Hamburger or mobile nav not found");
    }
  }
})();
//# sourceMappingURL=hamburger.js.map
