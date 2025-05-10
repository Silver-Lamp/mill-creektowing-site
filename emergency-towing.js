import "./main2.js";
import "./hamburger.js";
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", /* @__PURE__ */ new Date());
gtag("config", "G-XXXXXXXXXX");
document.addEventListener("DOMContentLoaded", function() {
  const schemaScript = document.querySelector('script[type="application/ld+json"]');
  if (schemaScript) {
    const schemaData = JSON.parse(schemaScript.getAttribute("data-schema"));
    schemaScript.textContent = JSON.stringify(schemaData, null, 2);
  }
});
document.getElementById("footer-year").textContent = (/* @__PURE__ */ new Date()).getFullYear();
document.addEventListener("config-ready", function() {
});
//# sourceMappingURL=emergency-towing.js.map
