(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function getSchemaData() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
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
function initSchema() {
  const schemaScript = document.getElementById("schema-markup");
  if (schemaScript) {
    schemaScript.textContent = JSON.stringify(getSchemaData(), null, 2);
  }
}
document.addEventListener("DOMContentLoaded", initSchema);
function waitForSentry() {
  return new Promise((resolve, reject) => {
    if (typeof Sentry !== "undefined") {
      resolve();
    } else {
      let attempts = 0;
      const maxAttempts = 50;
      const interval = setInterval(() => {
        attempts++;
        if (typeof Sentry !== "undefined") {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error("Sentry failed to load after 5 seconds"));
        }
      }, 100);
    }
  });
}
let transaction = null;
waitForSentry().then(() => {
  transaction = Sentry.startTransaction({
    name: "Page Load",
    op: "pageload"
  });
  window.addEventListener("load", () => {
    if (transaction) {
      transaction.finish();
    }
  });
}).catch((err) => {
  console.error("Sentry is not loaded. Using custom error reporter.");
  ErrorReporter.reportEvent("sentry_unavailable", {
    message: "Sentry failed to load"
  });
});
document.addEventListener("DOMContentLoaded", function() {
  try {
    const animatedElements = document.querySelectorAll("[data-anim-desktop]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.visibility = "visible";
          observer.unobserve(entry.target);
        }
      });
    });
    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  } catch (error) {
    if (typeof Sentry !== "undefined") {
      Sentry.captureException(error, {
        tags: {
          errorType: "animation_initialization"
        }
      });
    }
    ErrorReporter.reportEvent("animation_error", {
      error: error.message,
      stack: error.stack
    });
    console.error("Animation initialization error:", error);
  }
});
window.addEventListener("DOMContentLoaded", function() {
  try {
    document.querySelectorAll(".service-list li").forEach(function(li) {
      li.addEventListener("click", function(e) {
        var link = li.querySelector("a");
        if (link) {
          window.location = link.href;
        }
      });
      li.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          var link = li.querySelector("a");
          if (link) {
            window.location = link.href;
          }
        }
      });
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", li.textContent.trim());
    });
  } catch (error) {
    if (typeof Sentry !== "undefined") {
      Sentry.captureException(error, {
        tags: {
          errorType: "service_list_interaction"
        }
      });
    }
    ErrorReporter.reportEvent("service_list_error", {
      error: error.message,
      stack: error.stack
    });
    console.error("Service list interaction error:", error);
  }
});
document.addEventListener("DOMContentLoaded", function() {
  var form = document.querySelector(".form");
  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      let formTransaction;
      if (typeof Sentry !== "undefined") {
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
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
      var name = document.getElementById("name").value;
      var email = document.getElementById("email").value;
      var phone = document.getElementById("phone").value;
      var service = document.getElementById("service").value;
      console.log("Form submission attempt:", {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        formData: { name, email, phone, service },
        userAgent: navigator.userAgent,
        url: window.location.href,
        location: CONFIG.location_name
      });
      if (!name || !email || !phone || !service) {
        console.warn("Form validation failed:", {
          missingFields: {
            name: !name,
            email: !email,
            phone: !phone,
            service: !service
          },
          location: CONFIG.location_name
        });
        if (typeof Sentry !== "undefined") {
          Sentry.withScope(function(scope) {
            scope.setLevel("warning");
            scope.setTag("type", "form_validation");
            scope.setTag("location", CONFIG.location_name);
            scope.setExtra("missingFields", {
              name: !name,
              email: !email,
              phone: !phone,
              service: !service
            });
            Sentry.captureMessage("Form validation failed", "warning");
          });
        }
        alert("Please fill in all required fields.");
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        if (formTransaction) formTransaction.finish();
        return;
      }
      db.collection("contacts").add({
        name,
        email,
        phone,
        service,
        location: CONFIG.location_name,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          url: window.location.href,
          locationData: {
            name: CONFIG.location_name,
            city: CONFIG.address.city,
            state: CONFIG.address.state
          }
        }
      }).then(function(docRef) {
        console.info("Form submission success:", {
          type: "form_submission_success",
          documentId: docRef.id,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          location: CONFIG.location_name
        });
        if (typeof Sentry !== "undefined") {
          Sentry.withScope(function(scope) {
            scope.setLevel("info");
            scope.setTag("type", "form_success");
            scope.setTag("location", CONFIG.location_name);
            scope.setExtra("documentId", docRef.id);
            Sentry.captureMessage("Form submitted successfully", "info");
          });
        }
        alert("Thank you! Your message has been sent.");
        form.reset();
      }).catch(function(error) {
        console.error("Firebase error details:", {
          errorCode: error.code,
          errorMessage: error.message,
          errorStack: error.stack,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          formData: { name, email, phone, service },
          userAgent: navigator.userAgent,
          url: window.location.href,
          location: CONFIG.location_name
        });
        if (typeof Sentry !== "undefined") {
          Sentry.withScope(function(scope) {
            scope.setExtra("formData", {
              name,
              email,
              phone,
              service
            });
            scope.setExtra("userAgent", navigator.userAgent);
            scope.setExtra("url", window.location.href);
            scope.setTag("type", "form_submission_error");
            scope.setTag("location", CONFIG.location_name);
            scope.setTag("errorCode", error.code);
            Sentry.captureException(error);
          });
        }
        if (error.code === "permission-denied") {
          console.error("Firebase permissions error:", {
            error,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            location: CONFIG.location_name
          });
          alert(`Sorry, there was an error submitting your form. Please try again or call us directly at ${CONFIG.phone_number}.`);
        } else if (error.code === "unavailable") {
          console.error("Firebase service unavailable:", {
            error,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            location: CONFIG.location_name
          });
          alert(`Sorry, our service is temporarily unavailable. Please try again in a few minutes or call us directly at ${CONFIG.phone_number}.`);
        } else {
          console.error("Unexpected Firebase error:", {
            error,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            location: CONFIG.location_name
          });
          alert("Sorry, there was an error: " + error.message);
        }
      }).finally(function() {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        if (formTransaction) formTransaction.finish();
      });
    });
  }
});
document.addEventListener("DOMContentLoaded", function() {
  var phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function(e) {
      let x = e.target.value.replace(/\D/g, "").substring(0, 10);
      let formatted = "";
      if (x.length > 6) {
        formatted = `(${x.substring(0, 3)}) ${x.substring(3, 6)}-${x.substring(6, 10)}`;
      } else if (x.length > 3) {
        formatted = `(${x.substring(0, 3)}) ${x.substring(3, 6)}`;
      } else if (x.length > 0) {
        formatted = `(${x}`;
      }
      e.target.value = formatted;
    });
  }
  var emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("blur", function(e) {
      var value = e.target.value;
      var valid = /^[^@]+@[^@]+\.[^@]+$/.test(value);
      if (!valid && value.length > 0) {
        alert("Please enter a valid email address.");
        e.target.focus();
      }
    });
  }
});
document.addEventListener("config-ready", function() {
});
//# sourceMappingURL=main2.js.map
