// Minimal hamburger menu toggle
(function() {
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    function updateHamburgerDisplay() {
      if (window.innerWidth <= 900) {
        hamburger.style.display = 'block';
      } else {
        hamburger.style.display = 'none';
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    }
    updateHamburgerDisplay();
    window.addEventListener('resize', updateHamburgerDisplay);
    hamburger.addEventListener('click', function() {
      var expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !expanded);
      mobileNav.classList.toggle('open', !expanded);
    });
  } else {
    // Only log if in dev
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Hamburger or mobile nav not found');
    }
  }
})(); 