import "./main2.js";
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
document.addEventListener("DOMContentLoaded", function() {
  if (document.body.innerHTML.includes("{{")) {
    alert("⚠️ Unmerged placeholder detected on this page!");
    console.warn("⚠️ Unmerged placeholder detected on this page!");
  }
});
window.CONFIG = window.CONFIG || {};
fetch("site.config.json").then((response) => response.json()).then((config) => {
  Object.assign(window.CONFIG, config);
  if (config.coordinates && config.location_name && config.address) {
    const lat = parseFloat(config.coordinates.lat);
    const lng = parseFloat(config.coordinates.lng);
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2800.1234567890123!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52a8c2c2c2c2c2c2%3A0x2c2c2c2c2c2c2c2c!2s${encodeURIComponent(config.location_name)}%2C%20${config.address.state}!5e0!3m2!1sen!2sus!4v1647881234567!5m2!1sen!2sus`;
    console.log("CONFIG loaded:", config);
    console.log("lat:", lat, "lng:", lng, "mapUrl:", mapUrl);
    const mapIframe = document.querySelector(".footer-map iframe");
    if (mapIframe) {
      mapIframe.src = mapUrl;
    }
  }
  document.dispatchEvent(new Event("config-ready"));
}).catch((error) => console.error("Error loading configuration:", error));
function generateMapUrl(city, state, lat, lng) {
  const baseUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2800.1234567890123!2d";
  const mapUrl = `${baseUrl}${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52a8c2c2c2c2c2c2%3A0x2c2c2c2c2c2c2c2c!2s${encodeURIComponent(city)}%2C%20${state}!5e0!3m2!1sen!2sus!4v1647881234567!5m2!1sen!2sus`;
  return mapUrl;
}
function updateMap() {
  const mapIframe = document.querySelector(".footer-map iframe");
  if (mapIframe && window.CONFIG) {
    const { location_name, address, coordinates } = window.CONFIG;
    const mapUrl = generateMapUrl(location_name, address.state, coordinates.lat, coordinates.lng);
    mapIframe.src = mapUrl;
  }
}
document.addEventListener("config-ready", updateMap);
window.ErrorReporter = {
  // Store errors in localStorage with a maximum limit
  maxErrors: 100,
  // Initialize the error reporter
  init() {
    this.waitForSentry().then(() => {
      window.addEventListener("error", this.handleError.bind(this));
      window.addEventListener("unhandledrejection", this.handlePromiseError.bind(this));
      this.setupPerformanceMonitoring();
      this.setupFormMonitoring();
      console.log("Custom error reporter initialized");
    }).catch((err) => {
      console.warn("Failed to initialize Sentry:", err);
      window.addEventListener("error", this.handleError.bind(this));
      window.addEventListener("unhandledrejection", this.handlePromiseError.bind(this));
      this.setupPerformanceMonitoring();
      this.setupFormMonitoring();
      console.log("Custom error reporter initialized without Sentry");
    });
  },
  // Wait for Sentry to be ready
  waitForSentry() {
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
  },
  // Get common metadata for all events
  getCommonMetadata() {
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      location: CONFIG.location_name || "",
      city: CONFIG.address && CONFIG.address.city ? CONFIG.address.city : "",
      state: CONFIG.address && CONFIG.address.state ? CONFIG.address.state : "",
      business: CONFIG.business && CONFIG.business.name ? CONFIG.business.name : ""
    };
  },
  // Handle JavaScript errors
  handleError(event) {
    var _a;
    const error = {
      type: "error",
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: (_a = event.error) == null ? void 0 : _a.stack,
      ...this.getCommonMetadata()
    };
    this.storeError(error);
    this.logError(error);
  },
  // Handle unhandled promise rejections
  handlePromiseError(event) {
    var _a, _b;
    const error = {
      type: "promise",
      message: ((_a = event.reason) == null ? void 0 : _a.message) || "Unhandled Promise Rejection",
      stack: (_b = event.reason) == null ? void 0 : _b.stack,
      ...this.getCommonMetadata()
    };
    this.storeError(error);
    this.logError(error);
  },
  // Store error in localStorage
  storeError(error) {
    try {
      let errors = JSON.parse(localStorage.getItem("errorLog") || "[]");
      errors.unshift(error);
      if (errors.length > this.maxErrors) {
        errors = errors.slice(0, this.maxErrors);
      }
      localStorage.setItem("errorLog", JSON.stringify(errors));
    } catch (e) {
      console.error("Failed to store error:", e);
    }
  },
  // Log error to console
  logError(error) {
    if (error.type === "form_submission_success" || error.type === "performance") {
      console.info("Event captured:", error);
    } else {
      console.error("Error captured:", error);
    }
  },
  // Log success to console
  logSuccess(event) {
    console.info("Success:", event);
  },
  // Report success event
  reportSuccess(type, data) {
    const event = {
      type,
      ...data,
      ...this.getCommonMetadata()
    };
    this.storeError(event);
    this.logSuccess(event);
  },
  // Get all stored errors
  getErrors() {
    try {
      return JSON.parse(localStorage.getItem("errorLog") || "[]");
    } catch (e) {
      console.error("Failed to retrieve errors:", e);
      return [];
    }
  },
  // Clear stored errors
  clearErrors() {
    localStorage.removeItem("errorLog");
  },
  // Set up performance monitoring
  setupPerformanceMonitoring() {
    if (window.performance && window.performance.timing) {
      window.addEventListener("load", () => {
        const timing = window.performance.timing;
        const performance = {
          type: "performance",
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
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        new FormData(form);
        const formInfo = {
          type: "form_submission",
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
window.ErrorReporter.init();
document.addEventListener("config-ready", function() {
});
/*! @sentry/browser 7.101.1 (e4696dc) | https://github.com/getsentry/sentry-javascript */
(function(t) {
  const n = Object.prototype.toString;
  function e(t2) {
    switch (n.call(t2)) {
      case "[object Error]":
      case "[object Exception]":
      case "[object DOMException]":
        return true;
      default:
        return l(t2, Error);
    }
  }
  function r(t2, e2) {
    return n.call(t2) === `[object ${e2}]`;
  }
  function i(t2) {
    return r(t2, "ErrorEvent");
  }
  function o(t2) {
    return r(t2, "DOMError");
  }
  function s(t2) {
    return r(t2, "String");
  }
  function c(t2) {
    return "object" == typeof t2 && null !== t2 && "__sentry_template_string__" in t2 && "__sentry_template_values__" in t2;
  }
  function u(t2) {
    return null === t2 || c(t2) || "object" != typeof t2 && "function" != typeof t2;
  }
  function a(t2) {
    return r(t2, "Object");
  }
  function f(t2) {
    return "undefined" != typeof Event && l(t2, Event);
  }
  function h(t2) {
    return Boolean(t2 && t2.then && "function" == typeof t2.then);
  }
  function l(t2, n2) {
    try {
      return t2 instanceof n2;
    } catch (t3) {
      return false;
    }
  }
  function d(t2) {
    return !("object" != typeof t2 || null === t2 || !t2.__isVue && !t2.t);
  }
  function p(t2, n2 = 0) {
    return "string" != typeof t2 || 0 === n2 || t2.length <= n2 ? t2 : `${t2.slice(0, n2)}...`;
  }
  function m(t2, n2) {
    if (!Array.isArray(t2)) return "";
    const e2 = [];
    for (let n3 = 0; n3 < t2.length; n3++) {
      const r2 = t2[n3];
      try {
        d(r2) ? e2.push("[VueViewModel]") : e2.push(String(r2));
      } catch (t3) {
        e2.push("[value cannot be serialized]");
      }
    }
    return e2.join(n2);
  }
  function y(t2, n2, e2 = false) {
    return !!s(t2) && (r(n2, "RegExp") ? n2.test(t2) : !!s(n2) && (e2 ? t2 === n2 : t2.includes(n2)));
  }
  function g(t2, n2 = [], e2 = false) {
    return n2.some((n3) => y(t2, n3, e2));
  }
  function v(t2, n2, e2 = 250, r2, i2, o2, s2) {
    if (!(o2.exception && o2.exception.values && s2 && l(s2.originalException, Error))) return;
    const c2 = o2.exception.values.length > 0 ? o2.exception.values[o2.exception.values.length - 1] : void 0;
    var u2, a2;
    c2 && (o2.exception.values = (u2 = _(t2, n2, i2, s2.originalException, r2, o2.exception.values, c2, 0), a2 = e2, u2.map((t3) => (t3.value && (t3.value = p(t3.value, a2)), t3))));
  }
  function _(t2, n2, e2, r2, i2, o2, s2, c2) {
    if (o2.length >= e2 + 1) return o2;
    let u2 = [...o2];
    if (l(r2[i2], Error)) {
      b(s2, c2);
      const o3 = t2(n2, r2[i2]), a2 = u2.length;
      E(o3, i2, a2, c2), u2 = _(t2, n2, e2, r2[i2], i2, [o3, ...u2], o3, a2);
    }
    return Array.isArray(r2.errors) && r2.errors.forEach((r3, o3) => {
      if (l(r3, Error)) {
        b(s2, c2);
        const a2 = t2(n2, r3), f2 = u2.length;
        E(a2, `errors[${o3}]`, f2, c2), u2 = _(t2, n2, e2, r3, i2, [a2, ...u2], a2, f2);
      }
    }), u2;
  }
  function b(t2, n2) {
    t2.mechanism = t2.mechanism || { type: "generic", handled: true }, t2.mechanism = { ...t2.mechanism, is_exception_group: true, exception_id: n2 };
  }
  function E(t2, n2, e2, r2) {
    t2.mechanism = t2.mechanism || { type: "generic", handled: true }, t2.mechanism = { ...t2.mechanism, type: "chained", source: n2, exception_id: e2, parent_id: r2 };
  }
  function w(t2) {
    return t2 && t2.Math == Math ? t2 : void 0;
  }
  const $ = "object" == typeof globalThis && w(globalThis) || "object" == typeof window && w(window) || "object" == typeof self && w(self) || "object" == typeof global && w(global) || /* @__PURE__ */ function() {
    return this;
  }() || {};
  function S() {
    return $;
  }
  function x(t2, n2, e2) {
    const r2 = e2 || $, i2 = r2.__SENTRY__ = r2.__SENTRY__ || {};
    return i2[t2] || (i2[t2] = n2());
  }
  const k = S();
  function T(t2, n2 = {}) {
    if (!t2) return "<unknown>";
    try {
      let e2 = t2;
      const r2 = 5, i2 = [];
      let o2 = 0, s2 = 0;
      const c2 = " > ", u2 = c2.length;
      let a2;
      const f2 = Array.isArray(n2) ? n2 : n2.keyAttrs, h2 = !Array.isArray(n2) && n2.maxStringLength || 80;
      for (; e2 && o2++ < r2 && (a2 = j(e2, f2), !("html" === a2 || o2 > 1 && s2 + i2.length * u2 + a2.length >= h2)); ) i2.push(a2), s2 += a2.length, e2 = e2.parentNode;
      return i2.reverse().join(c2);
    } catch (t3) {
      return "<unknown>";
    }
  }
  function j(t2, n2) {
    const e2 = t2, r2 = [];
    let i2, o2, c2, u2, a2;
    if (!e2 || !e2.tagName) return "";
    if (k.HTMLElement && e2 instanceof HTMLElement && e2.dataset && e2.dataset.sentryComponent) return e2.dataset.sentryComponent;
    r2.push(e2.tagName.toLowerCase());
    const f2 = n2 && n2.length ? n2.filter((t3) => e2.getAttribute(t3)).map((t3) => [t3, e2.getAttribute(t3)]) : null;
    if (f2 && f2.length) f2.forEach((t3) => {
      r2.push(`[${t3[0]}="${t3[1]}"]`);
    });
    else if (e2.id && r2.push(`#${e2.id}`), i2 = e2.className, i2 && s(i2)) for (o2 = i2.split(/\s+/), a2 = 0; a2 < o2.length; a2++) r2.push(`.${o2[a2]}`);
    const h2 = ["aria-label", "type", "name", "title", "alt"];
    for (a2 = 0; a2 < h2.length; a2++) c2 = h2[a2], u2 = e2.getAttribute(c2), u2 && r2.push(`[${c2}="${u2}"]`);
    return r2.join("");
  }
  const O = ["debug", "info", "warn", "error", "log", "assert", "trace"], I = {};
  function D(t2) {
    if (!("console" in $)) return t2();
    const n2 = $.console, e2 = {}, r2 = Object.keys(I);
    r2.forEach((t3) => {
      const r3 = I[t3];
      e2[t3] = n2[t3], n2[t3] = r3;
    });
    try {
      return t2();
    } finally {
      r2.forEach((t3) => {
        n2[t3] = e2[t3];
      });
    }
  }
  const M = function() {
    let t2 = false;
    const n2 = { enable: () => {
      t2 = true;
    }, disable: () => {
      t2 = false;
    }, isEnabled: () => t2 };
    return O.forEach((t3) => {
      n2[t3] = () => {
      };
    }), n2;
  }(), R = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
  function C(t2, n2 = false) {
    const { host: e2, path: r2, pass: i2, port: o2, projectId: s2, protocol: c2, publicKey: u2 } = t2;
    return `${c2}://${u2}${n2 && i2 ? `:${i2}` : ""}@${e2}${o2 ? `:${o2}` : ""}/${r2 ? `${r2}/` : r2}${s2}`;
  }
  function A(t2) {
    return { protocol: t2.protocol, publicKey: t2.publicKey || "", pass: t2.pass || "", host: t2.host, port: t2.port || "", path: t2.path || "", projectId: t2.projectId };
  }
  function N(t2) {
    const n2 = "string" == typeof t2 ? function(t3) {
      const n3 = R.exec(t3);
      if (!n3) return void D(() => {
        console.error(`Invalid Sentry Dsn: ${t3}`);
      });
      const [e2, r2, i2 = "", o2, s2 = "", c2] = n3.slice(1);
      let u2 = "", a2 = c2;
      const f2 = a2.split("/");
      if (f2.length > 1 && (u2 = f2.slice(0, -1).join("/"), a2 = f2.pop()), a2) {
        const t4 = a2.match(/^\d+/);
        t4 && (a2 = t4[0]);
      }
      return A({ host: o2, pass: i2, path: u2, projectId: a2, port: s2, protocol: e2, publicKey: r2 });
    }(t2) : A(t2);
    if (n2) return n2;
  }
  class L extends Error {
    constructor(t2, n2 = "warn") {
      super(t2), this.message = t2, this.name = new.target.prototype.constructor.name, Object.setPrototypeOf(this, new.target.prototype), this.logLevel = n2;
    }
  }
  function P(t2, n2, e2) {
    if (!(n2 in t2)) return;
    const r2 = t2[n2], i2 = e2(r2);
    "function" == typeof i2 && B(i2, r2), t2[n2] = i2;
  }
  function U(t2, n2, e2) {
    try {
      Object.defineProperty(t2, n2, { value: e2, writable: true, configurable: true });
    } catch (t3) {
    }
  }
  function B(t2, n2) {
    try {
      const e2 = n2.prototype || {};
      t2.prototype = n2.prototype = e2, U(t2, "__sentry_original__", n2);
    } catch (t3) {
    }
  }
  function F(t2) {
    return t2.__sentry_original__;
  }
  function H(t2) {
    if (e(t2)) return { message: t2.message, name: t2.name, stack: t2.stack, ...W(t2) };
    if (f(t2)) {
      const n2 = { type: t2.type, target: q(t2.target), currentTarget: q(t2.currentTarget), ...W(t2) };
      return "undefined" != typeof CustomEvent && l(t2, CustomEvent) && (n2.detail = t2.detail), n2;
    }
    return t2;
  }
  function q(t2) {
    try {
      return n2 = t2, "undefined" != typeof Element && l(n2, Element) ? T(t2) : Object.prototype.toString.call(t2);
    } catch (t3) {
      return "<unknown>";
    }
    var n2;
  }
  function W(t2) {
    if ("object" == typeof t2 && null !== t2) {
      const n2 = {};
      for (const e2 in t2) Object.prototype.hasOwnProperty.call(t2, e2) && (n2[e2] = t2[e2]);
      return n2;
    }
    return {};
  }
  function z(t2) {
    return X(t2, /* @__PURE__ */ new Map());
  }
  function X(t2, n2) {
    if (function(t3) {
      if (!a(t3)) return false;
      try {
        const n3 = Object.getPrototypeOf(t3).constructor.name;
        return !n3 || "Object" === n3;
      } catch (t4) {
        return true;
      }
    }(t2)) {
      const e2 = n2.get(t2);
      if (void 0 !== e2) return e2;
      const r2 = {};
      n2.set(t2, r2);
      for (const e3 of Object.keys(t2)) void 0 !== t2[e3] && (r2[e3] = X(t2[e3], n2));
      return r2;
    }
    if (Array.isArray(t2)) {
      const e2 = n2.get(t2);
      if (void 0 !== e2) return e2;
      const r2 = [];
      return n2.set(t2, r2), t2.forEach((t3) => {
        r2.push(X(t3, n2));
      }), r2;
    }
    return t2;
  }
  const G = /\(error: (.*)\)/, J = /captureMessage|captureException/;
  function K(...t2) {
    const n2 = t2.sort((t3, n3) => t3[0] - n3[0]).map((t3) => t3[1]);
    return (t3, e2 = 0) => {
      const r2 = [], i2 = t3.split("\n");
      for (let t4 = e2; t4 < i2.length; t4++) {
        const e3 = i2[t4];
        if (e3.length > 1024) continue;
        const o2 = G.test(e3) ? e3.replace(G, "$1") : e3;
        if (!o2.match(/\S*Error: /)) {
          for (const t5 of n2) {
            const n3 = t5(o2);
            if (n3) {
              r2.push(n3);
              break;
            }
          }
          if (r2.length >= 50) break;
        }
      }
      return function(t4) {
        if (!t4.length) return [];
        const n3 = Array.from(t4);
        /sentryWrapped/.test(n3[n3.length - 1].function || "") && n3.pop();
        n3.reverse(), J.test(n3[n3.length - 1].function || "") && (n3.pop(), J.test(n3[n3.length - 1].function || "") && n3.pop());
        return n3.slice(0, 50).map((t5) => ({ ...t5, filename: t5.filename || n3[n3.length - 1].filename, function: t5.function || "?" }));
      }(r2);
    };
  }
  const V = "<anonymous>";
  function Y(t2) {
    try {
      return t2 && "function" == typeof t2 && t2.name || V;
    } catch (t3) {
      return V;
    }
  }
  const Z = {}, Q = {};
  function tt(t2, n2) {
    Z[t2] = Z[t2] || [], Z[t2].push(n2);
  }
  function nt(t2, n2) {
    Q[t2] || (n2(), Q[t2] = true);
  }
  function et(t2, n2) {
    const e2 = t2 && Z[t2];
    if (e2) for (const t3 of e2) try {
      t3(n2);
    } catch (t4) {
    }
  }
  function rt() {
    "console" in $ && O.forEach(function(t2) {
      t2 in $.console && P($.console, t2, function(n2) {
        return I[t2] = n2, function(...n3) {
          et("console", { args: n3, level: t2 });
          const e2 = I[t2];
          e2 && e2.apply($.console, n3);
        };
      });
    });
  }
  function it() {
    const t2 = $, n2 = t2.crypto || t2.msCrypto;
    let e2 = () => 16 * Math.random();
    try {
      if (n2 && n2.randomUUID) return n2.randomUUID().replace(/-/g, "");
      n2 && n2.getRandomValues && (e2 = () => {
        const t3 = new Uint8Array(1);
        return n2.getRandomValues(t3), t3[0];
      });
    } catch (t3) {
    }
    return ("10000000100040008000" + 1e11).replace(/[018]/g, (t3) => (t3 ^ (15 & e2()) >> t3 / 4).toString(16));
  }
  function ot(t2) {
    return t2.exception && t2.exception.values ? t2.exception.values[0] : void 0;
  }
  function st(t2) {
    const { message: n2, event_id: e2 } = t2;
    if (n2) return n2;
    const r2 = ot(t2);
    return r2 ? r2.type && r2.value ? `${r2.type}: ${r2.value}` : r2.type || r2.value || e2 || "<unknown>" : e2 || "<unknown>";
  }
  function ct(t2, n2, e2) {
    const r2 = t2.exception = t2.exception || {}, i2 = r2.values = r2.values || [], o2 = i2[0] = i2[0] || {};
    o2.value || (o2.value = n2 || ""), o2.type || (o2.type = "Error");
  }
  function ut(t2, n2) {
    const e2 = ot(t2);
    if (!e2) return;
    const r2 = e2.mechanism;
    if (e2.mechanism = { type: "generic", handled: true, ...r2, ...n2 }, n2 && "data" in n2) {
      const t3 = { ...r2 && r2.data, ...n2.data };
      e2.mechanism.data = t3;
    }
  }
  function at(t2) {
    if (t2 && t2.__sentry_captured__) return true;
    try {
      U(t2, "__sentry_captured__", true);
    } catch (t3) {
    }
    return false;
  }
  function ft(t2) {
    return Array.isArray(t2) ? t2 : [t2];
  }
  const ht = $;
  let lt, dt, pt;
  function mt() {
    if (!ht.document) return;
    const t2 = et.bind(null, "dom"), n2 = yt(t2, true);
    ht.document.addEventListener("click", n2, false), ht.document.addEventListener("keypress", n2, false), ["EventTarget", "Node"].forEach((n3) => {
      const e2 = ht[n3] && ht[n3].prototype;
      e2 && e2.hasOwnProperty && e2.hasOwnProperty("addEventListener") && (P(e2, "addEventListener", function(n4) {
        return function(e3, r2, i2) {
          if ("click" === e3 || "keypress" == e3) try {
            const r3 = this, o2 = r3.__sentry_instrumentation_handlers__ = r3.__sentry_instrumentation_handlers__ || {}, s2 = o2[e3] = o2[e3] || { refCount: 0 };
            if (!s2.handler) {
              const r4 = yt(t2);
              s2.handler = r4, n4.call(this, e3, r4, i2);
            }
            s2.refCount++;
          } catch (t3) {
          }
          return n4.call(this, e3, r2, i2);
        };
      }), P(e2, "removeEventListener", function(t3) {
        return function(n4, e3, r2) {
          if ("click" === n4 || "keypress" == n4) try {
            const e4 = this, i2 = e4.__sentry_instrumentation_handlers__ || {}, o2 = i2[n4];
            o2 && (o2.refCount--, o2.refCount <= 0 && (t3.call(this, n4, o2.handler, r2), o2.handler = void 0, delete i2[n4]), 0 === Object.keys(i2).length && delete e4.__sentry_instrumentation_handlers__);
          } catch (t4) {
          }
          return t3.call(this, n4, e3, r2);
        };
      }));
    });
  }
  function yt(t2, n2 = false) {
    return (e2) => {
      if (!e2 || e2._sentryCaptured) return;
      const r2 = function(t3) {
        try {
          return t3.target;
        } catch (t4) {
          return null;
        }
      }(e2);
      if (function(t3, n3) {
        return "keypress" === t3 && (!n3 || !n3.tagName || "INPUT" !== n3.tagName && "TEXTAREA" !== n3.tagName && !n3.isContentEditable);
      }(e2.type, r2)) return;
      U(e2, "_sentryCaptured", true), r2 && !r2._sentryId && U(r2, "_sentryId", it());
      const i2 = "keypress" === e2.type ? "input" : e2.type;
      if (!function(t3) {
        if (t3.type !== dt) return false;
        try {
          if (!t3.target || t3.target._sentryId !== pt) return false;
        } catch (t4) {
        }
        return true;
      }(e2)) {
        t2({ event: e2, name: i2, global: n2 }), dt = e2.type, pt = r2 ? r2._sentryId : void 0;
      }
      clearTimeout(lt), lt = ht.setTimeout(() => {
        pt = void 0, dt = void 0;
      }, 1e3);
    };
  }
  const gt = S();
  function vt() {
    if (!("fetch" in gt)) return false;
    try {
      return new Headers(), new Request("http://www.example.com"), new Response(), true;
    } catch (t2) {
      return false;
    }
  }
  function _t(t2) {
    return t2 && /^function fetch\(\)\s+\{\s+\[native code\]\s+\}$/.test(t2.toString());
  }
  function bt() {
    (function() {
      if ("string" == typeof EdgeRuntime) return true;
      if (!vt()) return false;
      if (_t(gt.fetch)) return true;
      let t2 = false;
      const n2 = gt.document;
      if (n2 && "function" == typeof n2.createElement) try {
        const e2 = n2.createElement("iframe");
        e2.hidden = true, n2.head.appendChild(e2), e2.contentWindow && e2.contentWindow.fetch && (t2 = _t(e2.contentWindow.fetch)), n2.head.removeChild(e2);
      } catch (t3) {
      }
      return t2;
    })() && P($, "fetch", function(t2) {
      return function(...n2) {
        const { method: e2, url: r2 } = function(t3) {
          if (0 === t3.length) return { method: "GET", url: "" };
          if (2 === t3.length) {
            const [n4, e3] = t3;
            return { url: wt(n4), method: Et(e3, "method") ? String(e3.method).toUpperCase() : "GET" };
          }
          const n3 = t3[0];
          return { url: wt(n3), method: Et(n3, "method") ? String(n3.method).toUpperCase() : "GET" };
        }(n2), i2 = { args: n2, fetchData: { method: e2, url: r2 }, startTimestamp: Date.now() };
        return et("fetch", { ...i2 }), t2.apply($, n2).then((t3) => (et("fetch", { ...i2, endTimestamp: Date.now(), response: t3 }), t3), (t3) => {
          throw et("fetch", { ...i2, endTimestamp: Date.now(), error: t3 }), t3;
        });
      };
    });
  }
  function Et(t2, n2) {
    return !!t2 && "object" == typeof t2 && !!t2[n2];
  }
  function wt(t2) {
    return "string" == typeof t2 ? t2 : t2 ? Et(t2, "url") ? t2.url : t2.toString ? t2.toString() : "" : "";
  }
  let $t = null;
  function St() {
    $t = $.onerror, $.onerror = function(t2, n2, e2, r2, i2) {
      const o2 = { column: r2, error: i2, line: e2, msg: t2, url: n2 };
      return et("error", o2), !(!$t || $t.__SENTRY_LOADER__) && $t.apply(this, arguments);
    }, $.onerror.__SENTRY_INSTRUMENTED__ = true;
  }
  let xt = null;
  function kt() {
    xt = $.onunhandledrejection, $.onunhandledrejection = function(t2) {
      const n2 = t2;
      return et("unhandledrejection", n2), !(xt && !xt.__SENTRY_LOADER__) || xt.apply(this, arguments);
    }, $.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
  }
  const Tt = S();
  const jt = $;
  let Ot;
  function It(t2) {
    const n2 = "history";
    tt(n2, t2), nt(n2, Dt);
  }
  function Dt() {
    if (!function() {
      const t3 = Tt.chrome, n3 = t3 && t3.app && t3.app.runtime, e2 = "history" in Tt && !!Tt.history.pushState && !!Tt.history.replaceState;
      return !n3 && e2;
    }()) return;
    const t2 = jt.onpopstate;
    function n2(t3) {
      return function(...n3) {
        const e2 = n3.length > 2 ? n3[2] : void 0;
        if (e2) {
          const t4 = Ot, n4 = String(e2);
          Ot = n4;
          et("history", { from: t4, to: n4 });
        }
        return t3.apply(this, n3);
      };
    }
    jt.onpopstate = function(...n3) {
      const e2 = jt.location.href, r2 = Ot;
      Ot = e2;
      if (et("history", { from: r2, to: e2 }), t2) try {
        return t2.apply(this, n3);
      } catch (t3) {
      }
    }, P(jt.history, "pushState", n2), P(jt.history, "replaceState", n2);
  }
  const Mt = $;
  function Rt() {
    if (!Mt.XMLHttpRequest) return;
    const t2 = XMLHttpRequest.prototype;
    P(t2, "open", function(t3) {
      return function(...n2) {
        const e2 = Date.now(), r2 = s(n2[0]) ? n2[0].toUpperCase() : void 0, i2 = function(t4) {
          if (s(t4)) return t4;
          try {
            return t4.toString();
          } catch (t5) {
          }
          return;
        }(n2[1]);
        if (!r2 || !i2) return t3.apply(this, n2);
        this.__sentry_xhr_v3__ = { method: r2, url: i2, request_headers: {} }, "POST" === r2 && i2.match(/sentry_key/) && (this.__sentry_own_request__ = true);
        const o2 = () => {
          const t4 = this.__sentry_xhr_v3__;
          if (t4 && 4 === this.readyState) {
            try {
              t4.status_code = this.status;
            } catch (t5) {
            }
            et("xhr", { args: [r2, i2], endTimestamp: Date.now(), startTimestamp: e2, xhr: this });
          }
        };
        return "onreadystatechange" in this && "function" == typeof this.onreadystatechange ? P(this, "onreadystatechange", function(t4) {
          return function(...n3) {
            return o2(), t4.apply(this, n3);
          };
        }) : this.addEventListener("readystatechange", o2), P(this, "setRequestHeader", function(t4) {
          return function(...n3) {
            const [e3, r3] = n3, i3 = this.__sentry_xhr_v3__;
            return i3 && s(e3) && s(r3) && (i3.request_headers[e3.toLowerCase()] = r3), t4.apply(this, n3);
          };
        }), t3.apply(this, n2);
      };
    }), P(t2, "send", function(t3) {
      return function(...n2) {
        const e2 = this.__sentry_xhr_v3__;
        if (!e2) return t3.apply(this, n2);
        void 0 !== n2[0] && (e2.body = n2[0]);
        return et("xhr", { args: [e2.method, e2.url], startTimestamp: Date.now(), xhr: this }), t3.apply(this, n2);
      };
    });
  }
  function Ct(t2, n2 = 100, e2 = 1 / 0) {
    try {
      return Nt("", t2, n2, e2);
    } catch (t3) {
      return { ERROR: `**non-serializable** (${t3})` };
    }
  }
  function At(t2, n2 = 3, e2 = 102400) {
    const r2 = Ct(t2, n2);
    return i2 = r2, function(t3) {
      return ~-encodeURI(t3).split(/%..|./).length;
    }(JSON.stringify(i2)) > e2 ? At(t2, n2 - 1, e2) : r2;
    var i2;
  }
  function Nt(t2, n2, e2 = 1 / 0, r2 = 1 / 0, i2 = /* @__PURE__ */ function() {
    const t3 = "function" == typeof WeakSet, n3 = t3 ? /* @__PURE__ */ new WeakSet() : [];
    return [function(e3) {
      if (t3) return !!n3.has(e3) || (n3.add(e3), false);
      for (let t4 = 0; t4 < n3.length; t4++) if (n3[t4] === e3) return true;
      return n3.push(e3), false;
    }, function(e3) {
      if (t3) n3.delete(e3);
      else for (let t4 = 0; t4 < n3.length; t4++) if (n3[t4] === e3) {
        n3.splice(t4, 1);
        break;
      }
    }];
  }()) {
    const [o2, s2] = i2;
    if (null == n2 || ["number", "boolean", "string"].includes(typeof n2) && ("number" != typeof (c2 = n2) || c2 == c2)) return n2;
    var c2;
    const u2 = function(t3, n3) {
      try {
        if ("domain" === t3 && n3 && "object" == typeof n3 && n3.i) return "[Domain]";
        if ("domainEmitter" === t3) return "[DomainEmitter]";
        if ("undefined" != typeof global && n3 === global) return "[Global]";
        if ("undefined" != typeof window && n3 === window) return "[Window]";
        if ("undefined" != typeof document && n3 === document) return "[Document]";
        if (d(n3)) return "[VueViewModel]";
        if (function(t4) {
          return a(t4) && "nativeEvent" in t4 && "preventDefault" in t4 && "stopPropagation" in t4;
        }(n3)) return "[SyntheticEvent]";
        if ("number" == typeof n3 && n3 != n3) return "[NaN]";
        if ("function" == typeof n3) return `[Function: ${Y(n3)}]`;
        if ("symbol" == typeof n3) return `[${String(n3)}]`;
        if ("bigint" == typeof n3) return `[BigInt: ${String(n3)}]`;
        const e3 = function(t4) {
          const n4 = Object.getPrototypeOf(t4);
          return n4 ? n4.constructor.name : "null prototype";
        }(n3);
        return /^HTML(\w*)Element$/.test(e3) ? `[HTMLElement: ${e3}]` : `[object ${e3}]`;
      } catch (t4) {
        return `**non-serializable** (${t4})`;
      }
    }(t2, n2);
    if (!u2.startsWith("[object ")) return u2;
    if (n2.__sentry_skip_normalization__) return n2;
    const f2 = "number" == typeof n2.__sentry_override_normalization_depth__ ? n2.__sentry_override_normalization_depth__ : e2;
    if (0 === f2) return u2.replace("object ", "");
    if (o2(n2)) return "[Circular ~]";
    const h2 = n2;
    if (h2 && "function" == typeof h2.toJSON) try {
      return Nt("", h2.toJSON(), f2 - 1, r2, i2);
    } catch (t3) {
    }
    const l2 = Array.isArray(n2) ? [] : {};
    let p2 = 0;
    const m2 = H(n2);
    for (const t3 in m2) {
      if (!Object.prototype.hasOwnProperty.call(m2, t3)) continue;
      if (p2 >= r2) {
        l2[t3] = "[MaxProperties ~]";
        break;
      }
      const n3 = m2[t3];
      l2[t3] = Nt(t3, n3, f2 - 1, r2, i2), p2++;
    }
    return s2(n2), l2;
  }
  var Lt;
  function Pt(t2) {
    return new Bt((n2) => {
      n2(t2);
    });
  }
  function Ut(t2) {
    return new Bt((n2, e2) => {
      e2(t2);
    });
  }
  !function(t2) {
    t2[t2.PENDING = 0] = "PENDING";
    t2[t2.RESOLVED = 1] = "RESOLVED";
    t2[t2.REJECTED = 2] = "REJECTED";
  }(Lt || (Lt = {}));
  class Bt {
    constructor(t2) {
      Bt.prototype.__init.call(this), Bt.prototype.__init2.call(this), Bt.prototype.__init3.call(this), Bt.prototype.__init4.call(this), this.o = Lt.PENDING, this.u = [];
      try {
        t2(this.h, this.l);
      } catch (t3) {
        this.l(t3);
      }
    }
    then(t2, n2) {
      return new Bt((e2, r2) => {
        this.u.push([false, (n3) => {
          if (t2) try {
            e2(t2(n3));
          } catch (t3) {
            r2(t3);
          }
          else e2(n3);
        }, (t3) => {
          if (n2) try {
            e2(n2(t3));
          } catch (t4) {
            r2(t4);
          }
          else r2(t3);
        }]), this.p();
      });
    }
    catch(t2) {
      return this.then((t3) => t3, t2);
    }
    finally(t2) {
      return new Bt((n2, e2) => {
        let r2, i2;
        return this.then((n3) => {
          i2 = false, r2 = n3, t2 && t2();
        }, (n3) => {
          i2 = true, r2 = n3, t2 && t2();
        }).then(() => {
          i2 ? e2(r2) : n2(r2);
        });
      });
    }
    __init() {
      this.h = (t2) => {
        this.m(Lt.RESOLVED, t2);
      };
    }
    __init2() {
      this.l = (t2) => {
        this.m(Lt.REJECTED, t2);
      };
    }
    __init3() {
      this.m = (t2, n2) => {
        this.o === Lt.PENDING && (h(n2) ? n2.then(this.h, this.l) : (this.o = t2, this.v = n2, this.p()));
      };
    }
    __init4() {
      this.p = () => {
        if (this.o === Lt.PENDING) return;
        const t2 = this.u.slice();
        this.u = [], t2.forEach((t3) => {
          t3[0] || (this.o === Lt.RESOLVED && t3[1](this.v), this.o === Lt.REJECTED && t3[2](this.v), t3[0] = true);
        });
      };
    }
  }
  function Ft(t2) {
    const n2 = [];
    function e2(t3) {
      return n2.splice(n2.indexOf(t3), 1)[0];
    }
    return { $: n2, add: function(r2) {
      if (!(void 0 === t2 || n2.length < t2)) return Ut(new L("Not adding Promise because buffer limit was reached."));
      const i2 = r2();
      return -1 === n2.indexOf(i2) && n2.push(i2), i2.then(() => e2(i2)).then(null, () => e2(i2).then(null, () => {
      })), i2;
    }, drain: function(t3) {
      return new Bt((e3, r2) => {
        let i2 = n2.length;
        if (!i2) return e3(true);
        const o2 = setTimeout(() => {
          t3 && t3 > 0 && e3(false);
        }, t3);
        n2.forEach((t4) => {
          Pt(t4).then(() => {
            --i2 || (clearTimeout(o2), e3(true));
          }, r2);
        });
      });
    } };
  }
  function Ht(t2) {
    if (!t2) return {};
    const n2 = t2.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
    if (!n2) return {};
    const e2 = n2[6] || "", r2 = n2[8] || "";
    return { host: n2[4], path: n2[5], protocol: n2[2], search: e2, hash: r2, relative: n2[5] + e2 + r2 };
  }
  const qt = ["fatal", "error", "warning", "log", "info", "debug"];
  function Wt(t2) {
    return "warn" === t2 ? "warning" : qt.includes(t2) ? t2 : "log";
  }
  function zt() {
    return Date.now() / 1e3;
  }
  const Xt = function() {
    const { performance: t2 } = $;
    if (!t2 || !t2.now) return zt;
    const n2 = Date.now() - t2.now(), e2 = null == t2.timeOrigin ? n2 : t2.timeOrigin;
    return () => (e2 + t2.now()) / 1e3;
  }();
  (() => {
    const { performance: t2 } = $;
    if (!t2 || !t2.now) return;
    const n2 = 36e5, e2 = t2.now(), r2 = Date.now(), i2 = t2.timeOrigin ? Math.abs(t2.timeOrigin + e2 - r2) : n2, o2 = i2 < n2, s2 = t2.timing && t2.timing.navigationStart, c2 = "number" == typeof s2 ? Math.abs(s2 + e2 - r2) : n2;
    (o2 || c2 < n2) && (i2 <= c2 && t2.timeOrigin);
  })();
  const Gt = /^sentry-/;
  function Jt(t2) {
    return t2.split(",").map((t3) => t3.split("=").map((t4) => decodeURIComponent(t4.trim()))).reduce((t3, [n2, e2]) => (t3[n2] = e2, t3), {});
  }
  const Kt = new RegExp("^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$");
  function Vt(t2, n2) {
    const e2 = function(t3) {
      if (!t3) return;
      const n3 = t3.match(Kt);
      if (!n3) return;
      let e3;
      return "1" === n3[3] ? e3 = true : "0" === n3[3] && (e3 = false), { traceId: n3[1], parentSampled: e3, parentSpanId: n3[2] };
    }(t2), r2 = function(t3) {
      if (!s(t3) && !Array.isArray(t3)) return;
      let n3 = {};
      if (Array.isArray(t3)) n3 = t3.reduce((t4, n4) => {
        const e4 = Jt(n4);
        for (const n5 of Object.keys(e4)) t4[n5] = e4[n5];
        return t4;
      }, {});
      else {
        if (!t3) return;
        n3 = Jt(t3);
      }
      const e3 = Object.entries(n3).reduce((t4, [n4, e4]) => (n4.match(Gt) && (t4[n4.slice("sentry-".length)] = e4), t4), {});
      return Object.keys(e3).length > 0 ? e3 : void 0;
    }(n2), { traceId: i2, parentSpanId: o2, parentSampled: c2 } = e2 || {};
    return e2 ? { traceparentData: e2, dynamicSamplingContext: r2 || {}, propagationContext: { traceId: i2 || it(), parentSpanId: o2 || it().substring(16), spanId: it().substring(16), sampled: c2, dsc: r2 || {} } } : { traceparentData: e2, dynamicSamplingContext: void 0, propagationContext: { traceId: i2 || it(), spanId: it().substring(16) } };
  }
  function Yt(t2, n2 = []) {
    return [t2, n2];
  }
  function Zt(t2, n2) {
    const [e2, r2] = t2;
    return [e2, [...r2, n2]];
  }
  function Qt(t2, n2) {
    const e2 = t2[1];
    for (const t3 of e2) {
      if (n2(t3, t3[0].type)) return true;
    }
    return false;
  }
  function tn(t2, n2) {
    return (n2 || new TextEncoder()).encode(t2);
  }
  function nn(t2, n2) {
    const [e2, r2] = t2;
    let i2 = JSON.stringify(e2);
    function o2(t3) {
      "string" == typeof i2 ? i2 = "string" == typeof t3 ? i2 + t3 : [tn(i2, n2), t3] : i2.push("string" == typeof t3 ? tn(t3, n2) : t3);
    }
    for (const t3 of r2) {
      const [n3, e3] = t3;
      if (o2(`
${JSON.stringify(n3)}
`), "string" == typeof e3 || e3 instanceof Uint8Array) o2(e3);
      else {
        let t4;
        try {
          t4 = JSON.stringify(e3);
        } catch (n4) {
          t4 = JSON.stringify(Ct(e3));
        }
        o2(t4);
      }
    }
    return "string" == typeof i2 ? i2 : function(t3) {
      const n3 = t3.reduce((t4, n4) => t4 + n4.length, 0), e3 = new Uint8Array(n3);
      let r3 = 0;
      for (const n4 of t3) e3.set(n4, r3), r3 += n4.length;
      return e3;
    }(i2);
  }
  function en(t2, n2) {
    const e2 = "string" == typeof t2.data ? tn(t2.data, n2) : t2.data;
    return [z({ type: "attachment", length: e2.length, filename: t2.filename, content_type: t2.contentType, attachment_type: t2.attachmentType }), e2];
  }
  const rn = { session: "session", sessions: "session", attachment: "attachment", transaction: "transaction", event: "error", client_report: "internal", user_report: "default", profile: "profile", replay_event: "replay", replay_recording: "replay", check_in: "monitor", feedback: "feedback", statsd: "unknown" };
  function on(t2) {
    return rn[t2];
  }
  function sn(t2) {
    if (!t2 || !t2.sdk) return;
    const { name: n2, version: e2 } = t2.sdk;
    return { name: n2, version: e2 };
  }
  function cn(t2, { statusCode: n2, headers: e2 }, r2 = Date.now()) {
    const i2 = { ...t2 }, o2 = e2 && e2["x-sentry-rate-limits"], s2 = e2 && e2["retry-after"];
    if (o2) for (const t3 of o2.trim().split(",")) {
      const [n3, e3] = t3.split(":", 2), o3 = parseInt(n3, 10), s3 = 1e3 * (isNaN(o3) ? 60 : o3);
      if (e3) for (const t4 of e3.split(";")) i2[t4] = r2 + s3;
      else i2.all = r2 + s3;
    }
    else s2 ? i2.all = r2 + function(t3, n3 = Date.now()) {
      const e3 = parseInt(`${t3}`, 10);
      if (!isNaN(e3)) return 1e3 * e3;
      const r3 = Date.parse(`${t3}`);
      return isNaN(r3) ? 6e4 : r3 - n3;
    }(s2, r2) : 429 === n2 && (i2.all = r2 + 6e4);
    return i2;
  }
  function un(t2, n2) {
    const e2 = { type: n2.name || n2.constructor.name, value: n2.message }, r2 = function(t3, n3) {
      return t3(n3.stack || "", 1);
    }(t2, n2);
    return r2.length && (e2.stacktrace = { frames: r2 }), e2;
  }
  class an {
    static __initStatic() {
      this.id = "Feedback";
    }
    constructor(t2) {
      this.name = an.id, D(() => {
        console.warn("You are using new Feedback() even though this bundle does not include Feedback.");
      });
    }
    setupOnce() {
    }
    openDialog() {
    }
    closeDialog() {
    }
    attachTo() {
    }
    createWidget() {
    }
    removeWidget() {
    }
    getWidget() {
    }
    remove() {
    }
  }
  an.__initStatic();
  class fn {
    static __initStatic() {
      this.id = "Replay";
    }
    constructor(t2) {
      this.name = fn.id, D(() => {
        console.warn("You are using new Replay() even though this bundle does not include replay.");
      });
    }
    setupOnce() {
    }
    start() {
    }
    stop() {
    }
    flush() {
    }
  }
  fn.__initStatic();
  class hn {
    static __initStatic() {
      this.id = "BrowserTracing";
    }
    constructor(t2) {
      this.name = hn.id, D(() => {
        console.warn("You are using new BrowserTracing() even though this bundle does not include tracing.");
      });
    }
    setupOnce() {
    }
  }
  hn.__initStatic();
  const ln = "production";
  function dn() {
    return x("globalEventProcessors", () => []);
  }
  function pn(t2) {
    dn().push(t2);
  }
  function mn(t2, n2, e2, r2 = 0) {
    return new Bt((i2, o2) => {
      const s2 = t2[r2];
      if (null === n2 || "function" != typeof s2) i2(n2);
      else {
        const c2 = s2({ ...n2 }, e2);
        h(c2) ? c2.then((n3) => mn(t2, n3, e2, r2 + 1).then(i2)).then(null, o2) : mn(t2, c2, e2, r2 + 1).then(i2).then(null, o2);
      }
    });
  }
  function yn(t2) {
    const n2 = Xt(), e2 = { sid: it(), init: true, timestamp: n2, started: n2, duration: 0, status: "ok", errors: 0, ignoreDuration: false, toJSON: () => function(t3) {
      return z({ sid: `${t3.sid}`, init: t3.init, started: new Date(1e3 * t3.started).toISOString(), timestamp: new Date(1e3 * t3.timestamp).toISOString(), status: t3.status, errors: t3.errors, did: "number" == typeof t3.did || "string" == typeof t3.did ? `${t3.did}` : void 0, duration: t3.duration, abnormal_mechanism: t3.abnormal_mechanism, attrs: { release: t3.release, environment: t3.environment, ip_address: t3.ipAddress, user_agent: t3.userAgent } });
    }(e2) };
    return t2 && gn(e2, t2), e2;
  }
  function gn(t2, n2 = {}) {
    if (n2.user && (!t2.ipAddress && n2.user.ip_address && (t2.ipAddress = n2.user.ip_address), t2.did || n2.did || (t2.did = n2.user.id || n2.user.email || n2.user.username)), t2.timestamp = n2.timestamp || Xt(), n2.abnormal_mechanism && (t2.abnormal_mechanism = n2.abnormal_mechanism), n2.ignoreDuration && (t2.ignoreDuration = n2.ignoreDuration), n2.sid && (t2.sid = 32 === n2.sid.length ? n2.sid : it()), void 0 !== n2.init && (t2.init = n2.init), !t2.did && n2.did && (t2.did = `${n2.did}`), "number" == typeof n2.started && (t2.started = n2.started), t2.ignoreDuration) t2.duration = void 0;
    else if ("number" == typeof n2.duration) t2.duration = n2.duration;
    else {
      const n3 = t2.timestamp - t2.started;
      t2.duration = n3 >= 0 ? n3 : 0;
    }
    n2.release && (t2.release = n2.release), n2.environment && (t2.environment = n2.environment), !t2.ipAddress && n2.ipAddress && (t2.ipAddress = n2.ipAddress), !t2.userAgent && n2.userAgent && (t2.userAgent = n2.userAgent), "number" == typeof n2.errors && (t2.errors = n2.errors), n2.status && (t2.status = n2.status);
  }
  function vn(t2, n2) {
    let e2 = {};
    "ok" === t2.status && (e2 = { status: "exited" }), gn(t2, e2);
  }
  function _n(t2) {
    const { spanId: n2, traceId: e2 } = t2.spanContext(), { data: r2, op: i2, parent_span_id: o2, status: s2, tags: c2, origin: u2 } = En(t2);
    return z({ data: r2, op: i2, parent_span_id: o2, span_id: n2, status: s2, tags: c2, trace_id: e2, origin: u2 });
  }
  function bn(t2) {
    return t2 > 9999999999 ? t2 / 1e3 : t2;
  }
  function En(t2) {
    return function(t3) {
      return "function" == typeof t3.getSpanJSON;
    }(t2) ? t2.getSpanJSON() : "function" == typeof t2.toJSON ? t2.toJSON() : {};
  }
  function wn(t2, n2, e2, r2, i2, o2) {
    const { normalizeDepth: s2 = 3, normalizeMaxBreadth: c2 = 1e3 } = t2, u2 = { ...n2, event_id: n2.event_id || e2.event_id || it(), timestamp: n2.timestamp || zt() }, a2 = e2.integrations || t2.integrations.map((t3) => t3.name);
    !function(t3, n3) {
      const { environment: e3, release: r3, dist: i3, maxValueLength: o3 = 250 } = n3;
      "environment" in t3 || (t3.environment = "environment" in n3 ? e3 : ln);
      void 0 === t3.release && void 0 !== r3 && (t3.release = r3);
      void 0 === t3.dist && void 0 !== i3 && (t3.dist = i3);
      t3.message && (t3.message = p(t3.message, o3));
      const s3 = t3.exception && t3.exception.values && t3.exception.values[0];
      s3 && s3.value && (s3.value = p(s3.value, o3));
      const c3 = t3.request;
      c3 && c3.url && (c3.url = p(c3.url, o3));
    }(u2, t2), function(t3, n3) {
      n3.length > 0 && (t3.sdk = t3.sdk || {}, t3.sdk.integrations = [...t3.sdk.integrations || [], ...n3]);
    }(u2, a2), void 0 === n2.type && function(t3, n3) {
      const e3 = $._sentryDebugIds;
      if (!e3) return;
      let r3;
      const i3 = $n.get(n3);
      i3 ? r3 = i3 : (r3 = /* @__PURE__ */ new Map(), $n.set(n3, r3));
      const o3 = Object.keys(e3).reduce((t4, i4) => {
        let o4;
        const s3 = r3.get(i4);
        s3 ? o4 = s3 : (o4 = n3(i4), r3.set(i4, o4));
        for (let n4 = o4.length - 1; n4 >= 0; n4--) {
          const r4 = o4[n4];
          if (r4.filename) {
            t4[r4.filename] = e3[i4];
            break;
          }
        }
        return t4;
      }, {});
      try {
        t3.exception.values.forEach((t4) => {
          t4.stacktrace.frames.forEach((t5) => {
            t5.filename && (t5.debug_id = o3[t5.filename]);
          });
        });
      } catch (t4) {
      }
    }(u2, t2.stackParser);
    const f2 = function(t3, n3) {
      if (!n3) return t3;
      const e3 = t3 ? t3.clone() : new Hn();
      return e3.update(n3), e3;
    }(r2, e2.captureContext);
    e2.mechanism && ut(u2, e2.mechanism);
    const h2 = i2 && i2.getEventProcessors ? i2.getEventProcessors() : [], l2 = function() {
      Fn || (Fn = new Hn());
      return Fn;
    }().getScopeData();
    if (o2) {
      Un(l2, o2.getScopeData());
    }
    if (f2) {
      Un(l2, f2.getScopeData());
    }
    const d2 = [...e2.attachments || [], ...l2.attachments];
    d2.length && (e2.attachments = d2), Pn(u2, l2);
    return mn([...h2, ...dn(), ...l2.eventProcessors], u2, e2).then((t3) => (t3 && function(t4) {
      const n3 = {};
      try {
        t4.exception.values.forEach((t5) => {
          t5.stacktrace.frames.forEach((t6) => {
            t6.debug_id && (t6.abs_path ? n3[t6.abs_path] = t6.debug_id : t6.filename && (n3[t6.filename] = t6.debug_id), delete t6.debug_id);
          });
        });
      } catch (t5) {
      }
      if (0 === Object.keys(n3).length) return;
      t4.debug_meta = t4.debug_meta || {}, t4.debug_meta.images = t4.debug_meta.images || [];
      const e3 = t4.debug_meta.images;
      Object.keys(n3).forEach((t5) => {
        e3.push({ type: "sourcemap", code_file: t5, debug_id: n3[t5] });
      });
    }(t3), "number" == typeof s2 && s2 > 0 ? function(t4, n3, e3) {
      if (!t4) return null;
      const r3 = { ...t4, ...t4.breadcrumbs && { breadcrumbs: t4.breadcrumbs.map((t5) => ({ ...t5, ...t5.data && { data: Ct(t5.data, n3, e3) } })) }, ...t4.user && { user: Ct(t4.user, n3, e3) }, ...t4.contexts && { contexts: Ct(t4.contexts, n3, e3) }, ...t4.extra && { extra: Ct(t4.extra, n3, e3) } };
      t4.contexts && t4.contexts.trace && r3.contexts && (r3.contexts.trace = t4.contexts.trace, t4.contexts.trace.data && (r3.contexts.trace.data = Ct(t4.contexts.trace.data, n3, e3)));
      t4.spans && (r3.spans = t4.spans.map((t5) => {
        const r4 = En(t5).data;
        return r4 && (t5.data = Ct(r4, n3, e3)), t5;
      }));
      return r3;
    }(t3, s2, c2) : t3));
  }
  const $n = /* @__PURE__ */ new WeakMap();
  function Sn(t2) {
    if (t2) return function(t3) {
      return t3 instanceof Hn || "function" == typeof t3;
    }(t2) || function(t3) {
      return Object.keys(t3).some((t4) => xn.includes(t4));
    }(t2) ? { captureContext: t2 } : t2;
  }
  const xn = ["user", "level", "extra", "contexts", "tags", "fingerprint", "requestSession", "propagationContext"];
  function captureException(t2, n2) {
    return Vn().captureException(t2, Sn(n2));
  }
  function kn(t2, n2) {
    return Vn().captureEvent(t2, n2);
  }
  function Tn(t2, n2) {
    Vn().addBreadcrumb(t2, n2);
  }
  function jn(...t2) {
    const n2 = Vn();
    if (2 === t2.length) {
      const [e2, r2] = t2;
      return e2 ? n2.withScope(() => (n2.getStackTop().scope = e2, r2(e2))) : n2.withScope(r2);
    }
    return n2.withScope(t2[0]);
  }
  function On() {
    return Vn().getClient();
  }
  function In() {
    return Vn().getScope();
  }
  function Dn(t2) {
    const n2 = On(), e2 = Yn(), r2 = In(), { release: i2, environment: o2 = ln } = n2 && n2.getOptions() || {}, { userAgent: s2 } = $.navigator || {}, c2 = yn({ release: i2, environment: o2, user: r2.getUser() || e2.getUser(), ...s2 && { userAgent: s2 }, ...t2 }), u2 = e2.getSession();
    return u2 && "ok" === u2.status && gn(u2, { status: "exited" }), Mn(), e2.setSession(c2), r2.setSession(c2), c2;
  }
  function Mn() {
    const t2 = Yn(), n2 = In(), e2 = n2.getSession() || t2.getSession();
    e2 && vn(e2), Rn(), t2.setSession(), n2.setSession();
  }
  function Rn() {
    const t2 = Yn(), n2 = In(), e2 = On(), r2 = n2.getSession() || t2.getSession();
    r2 && e2 && e2.captureSession && e2.captureSession(r2);
  }
  function Cn(t2 = false) {
    t2 ? Mn() : Rn();
  }
  function An(t2) {
    return t2.transaction;
  }
  function Nn(t2, n2, e2) {
    const r2 = n2.getOptions(), { publicKey: i2 } = n2.getDsn() || {}, { segment: o2 } = e2 && e2.getUser() || {}, s2 = z({ environment: r2.environment || ln, release: r2.release, user_segment: o2, public_key: i2, trace_id: t2 });
    return n2.emit && n2.emit("createDsc", s2), s2;
  }
  function Ln(t2) {
    const n2 = On();
    if (!n2) return {};
    const e2 = Nn(En(t2).trace_id || "", n2, In()), r2 = An(t2);
    if (!r2) return e2;
    const i2 = r2 && r2._frozenDynamicSamplingContext;
    if (i2) return i2;
    const { sampleRate: o2, source: s2 } = r2.metadata;
    null != o2 && (e2.sample_rate = `${o2}`);
    const c2 = En(r2);
    return s2 && "url" !== s2 && (e2.transaction = c2.description), e2.sampled = String(function(t3) {
      const { traceFlags: n3 } = t3.spanContext();
      return Boolean(1 & n3);
    }(r2)), n2.emit && n2.emit("createDsc", e2), e2;
  }
  function Pn(t2, n2) {
    const { fingerprint: e2, span: r2, breadcrumbs: i2, sdkProcessingMetadata: o2 } = n2;
    !function(t3, n3) {
      const { extra: e3, tags: r3, user: i3, contexts: o3, level: s2, transactionName: c2 } = n3, u2 = z(e3);
      u2 && Object.keys(u2).length && (t3.extra = { ...u2, ...t3.extra });
      const a2 = z(r3);
      a2 && Object.keys(a2).length && (t3.tags = { ...a2, ...t3.tags });
      const f2 = z(i3);
      f2 && Object.keys(f2).length && (t3.user = { ...f2, ...t3.user });
      const h2 = z(o3);
      h2 && Object.keys(h2).length && (t3.contexts = { ...h2, ...t3.contexts });
      s2 && (t3.level = s2);
      c2 && (t3.transaction = c2);
    }(t2, n2), r2 && function(t3, n3) {
      t3.contexts = { trace: _n(n3), ...t3.contexts };
      const e3 = An(n3);
      if (e3) {
        t3.sdkProcessingMetadata = { dynamicSamplingContext: Ln(n3), ...t3.sdkProcessingMetadata };
        const r3 = En(e3).description;
        r3 && (t3.tags = { transaction: r3, ...t3.tags });
      }
    }(t2, r2), function(t3, n3) {
      t3.fingerprint = t3.fingerprint ? ft(t3.fingerprint) : [], n3 && (t3.fingerprint = t3.fingerprint.concat(n3));
      t3.fingerprint && !t3.fingerprint.length && delete t3.fingerprint;
    }(t2, e2), function(t3, n3) {
      const e3 = [...t3.breadcrumbs || [], ...n3];
      t3.breadcrumbs = e3.length ? e3 : void 0;
    }(t2, i2), function(t3, n3) {
      t3.sdkProcessingMetadata = { ...t3.sdkProcessingMetadata, ...n3 };
    }(t2, o2);
  }
  function Un(t2, n2) {
    const { extra: e2, tags: r2, user: i2, contexts: o2, level: s2, sdkProcessingMetadata: c2, breadcrumbs: u2, fingerprint: a2, eventProcessors: f2, attachments: h2, propagationContext: l2, transactionName: d2, span: p2 } = n2;
    Bn(t2, "extra", e2), Bn(t2, "tags", r2), Bn(t2, "user", i2), Bn(t2, "contexts", o2), Bn(t2, "sdkProcessingMetadata", c2), s2 && (t2.level = s2), d2 && (t2.transactionName = d2), p2 && (t2.span = p2), u2.length && (t2.breadcrumbs = [...t2.breadcrumbs, ...u2]), a2.length && (t2.fingerprint = [...t2.fingerprint, ...a2]), f2.length && (t2.eventProcessors = [...t2.eventProcessors, ...f2]), h2.length && (t2.attachments = [...t2.attachments, ...h2]), t2.propagationContext = { ...t2.propagationContext, ...l2 };
  }
  function Bn(t2, n2, e2) {
    if (e2 && Object.keys(e2).length) {
      t2[n2] = { ...t2[n2] };
      for (const r2 in e2) Object.prototype.hasOwnProperty.call(e2, r2) && (t2[n2][r2] = e2[r2]);
    }
  }
  let Fn;
  class Hn {
    constructor() {
      this._ = false, this.S = [], this.k = [], this.T = [], this.j = [], this.O = {}, this.I = {}, this.D = {}, this.M = {}, this.R = {}, this.C = qn();
    }
    static clone(t2) {
      return t2 ? t2.clone() : new Hn();
    }
    clone() {
      const t2 = new Hn();
      return t2.T = [...this.T], t2.I = { ...this.I }, t2.D = { ...this.D }, t2.M = { ...this.M }, t2.O = this.O, t2.A = this.A, t2.N = this.N, t2.L = this.L, t2.P = this.P, t2.U = this.U, t2.k = [...this.k], t2.B = this.B, t2.j = [...this.j], t2.R = { ...this.R }, t2.C = { ...this.C }, t2.F = this.F, t2;
    }
    setClient(t2) {
      this.F = t2;
    }
    getClient() {
      return this.F;
    }
    addScopeListener(t2) {
      this.S.push(t2);
    }
    addEventProcessor(t2) {
      return this.k.push(t2), this;
    }
    setUser(t2) {
      return this.O = t2 || { email: void 0, id: void 0, ip_address: void 0, segment: void 0, username: void 0 }, this.L && gn(this.L, { user: t2 }), this.H(), this;
    }
    getUser() {
      return this.O;
    }
    getRequestSession() {
      return this.B;
    }
    setRequestSession(t2) {
      return this.B = t2, this;
    }
    setTags(t2) {
      return this.I = { ...this.I, ...t2 }, this.H(), this;
    }
    setTag(t2, n2) {
      return this.I = { ...this.I, [t2]: n2 }, this.H(), this;
    }
    setExtras(t2) {
      return this.D = { ...this.D, ...t2 }, this.H(), this;
    }
    setExtra(t2, n2) {
      return this.D = { ...this.D, [t2]: n2 }, this.H(), this;
    }
    setFingerprint(t2) {
      return this.U = t2, this.H(), this;
    }
    setLevel(t2) {
      return this.A = t2, this.H(), this;
    }
    setTransactionName(t2) {
      return this.P = t2, this.H(), this;
    }
    setContext(t2, n2) {
      return null === n2 ? delete this.M[t2] : this.M[t2] = n2, this.H(), this;
    }
    setSpan(t2) {
      return this.N = t2, this.H(), this;
    }
    getSpan() {
      return this.N;
    }
    getTransaction() {
      const t2 = this.N;
      return t2 && t2.transaction;
    }
    setSession(t2) {
      return t2 ? this.L = t2 : delete this.L, this.H(), this;
    }
    getSession() {
      return this.L;
    }
    update(t2) {
      if (!t2) return this;
      if ("function" == typeof t2) {
        const n2 = t2(this);
        return n2 instanceof Hn ? n2 : this;
      }
      return t2 instanceof Hn ? (this.I = { ...this.I, ...t2.I }, this.D = { ...this.D, ...t2.D }, this.M = { ...this.M, ...t2.M }, t2.O && Object.keys(t2.O).length && (this.O = t2.O), t2.A && (this.A = t2.A), t2.U && (this.U = t2.U), t2.B && (this.B = t2.B), t2.C && (this.C = t2.C)) : a(t2) && (t2 = t2, this.I = { ...this.I, ...t2.tags }, this.D = { ...this.D, ...t2.extra }, this.M = { ...this.M, ...t2.contexts }, t2.user && (this.O = t2.user), t2.level && (this.A = t2.level), t2.fingerprint && (this.U = t2.fingerprint), t2.requestSession && (this.B = t2.requestSession), t2.propagationContext && (this.C = t2.propagationContext)), this;
    }
    clear() {
      return this.T = [], this.I = {}, this.D = {}, this.O = {}, this.M = {}, this.A = void 0, this.P = void 0, this.U = void 0, this.B = void 0, this.N = void 0, this.L = void 0, this.H(), this.j = [], this.C = qn(), this;
    }
    addBreadcrumb(t2, n2) {
      const e2 = "number" == typeof n2 ? n2 : 100;
      if (e2 <= 0) return this;
      const r2 = { timestamp: zt(), ...t2 }, i2 = this.T;
      return i2.push(r2), this.T = i2.length > e2 ? i2.slice(-e2) : i2, this.H(), this;
    }
    getLastBreadcrumb() {
      return this.T[this.T.length - 1];
    }
    clearBreadcrumbs() {
      return this.T = [], this.H(), this;
    }
    addAttachment(t2) {
      return this.j.push(t2), this;
    }
    getAttachments() {
      return this.getScopeData().attachments;
    }
    clearAttachments() {
      return this.j = [], this;
    }
    getScopeData() {
      const { T: t2, j: n2, M: e2, I: r2, D: i2, O: o2, A: s2, U: c2, k: u2, C: a2, R: f2, P: h2, N: l2 } = this;
      return { breadcrumbs: t2, attachments: n2, contexts: e2, tags: r2, extra: i2, user: o2, level: s2, fingerprint: c2 || [], eventProcessors: u2, propagationContext: a2, sdkProcessingMetadata: f2, transactionName: h2, span: l2 };
    }
    applyToEvent(t2, n2 = {}, e2 = []) {
      Pn(t2, this.getScopeData());
      return mn([...e2, ...dn(), ...this.k], t2, n2);
    }
    setSDKProcessingMetadata(t2) {
      return this.R = { ...this.R, ...t2 }, this;
    }
    setPropagationContext(t2) {
      return this.C = t2, this;
    }
    getPropagationContext() {
      return this.C;
    }
    captureException(t2, n2) {
      const e2 = n2 && n2.event_id ? n2.event_id : it();
      if (!this.F) return M.warn("No client configured on scope - will not capture exception!"), e2;
      const r2 = new Error("Sentry syntheticException");
      return this.F.captureException(t2, { originalException: t2, syntheticException: r2, ...n2, event_id: e2 }, this), e2;
    }
    captureMessage(t2, n2, e2) {
      const r2 = e2 && e2.event_id ? e2.event_id : it();
      if (!this.F) return M.warn("No client configured on scope - will not capture message!"), r2;
      const i2 = new Error(t2);
      return this.F.captureMessage(t2, n2, { originalException: t2, syntheticException: i2, ...e2, event_id: r2 }, this), r2;
    }
    captureEvent(t2, n2) {
      const e2 = n2 && n2.event_id ? n2.event_id : it();
      return this.F ? (this.F.captureEvent(t2, { ...n2, event_id: e2 }, this), e2) : (M.warn("No client configured on scope - will not capture event!"), e2);
    }
    H() {
      this._ || (this._ = true, this.S.forEach((t2) => {
        t2(this);
      }), this._ = false);
    }
  }
  function qn() {
    return { traceId: it(), spanId: it().substring(16) };
  }
  const Wn = "7.101.1", zn = parseFloat(Wn), Xn = 100;
  class Gn {
    constructor(t2, n2, e2, r2 = zn) {
      let i2, o2;
      this.q = r2, n2 ? i2 = n2 : (i2 = new Hn(), i2.setClient(t2)), e2 ? o2 = e2 : (o2 = new Hn(), o2.setClient(t2)), this.W = [{ scope: i2 }], t2 && this.bindClient(t2), this.X = o2;
    }
    isOlderThan(t2) {
      return this.q < t2;
    }
    bindClient(t2) {
      const n2 = this.getStackTop();
      n2.client = t2, n2.scope.setClient(t2), t2 && t2.setupIntegrations && t2.setupIntegrations();
    }
    pushScope() {
      const t2 = this.getScope().clone();
      return this.getStack().push({ client: this.getClient(), scope: t2 }), t2;
    }
    popScope() {
      return !(this.getStack().length <= 1) && !!this.getStack().pop();
    }
    withScope(t2) {
      const n2 = this.pushScope();
      let e2;
      try {
        e2 = t2(n2);
      } catch (t3) {
        throw this.popScope(), t3;
      }
      return h(e2) ? e2.then((t3) => (this.popScope(), t3), (t3) => {
        throw this.popScope(), t3;
      }) : (this.popScope(), e2);
    }
    getClient() {
      return this.getStackTop().client;
    }
    getScope() {
      return this.getStackTop().scope;
    }
    getIsolationScope() {
      return this.X;
    }
    getStack() {
      return this.W;
    }
    getStackTop() {
      return this.W[this.W.length - 1];
    }
    captureException(t2, n2) {
      const e2 = this.G = n2 && n2.event_id ? n2.event_id : it(), r2 = new Error("Sentry syntheticException");
      return this.getScope().captureException(t2, { originalException: t2, syntheticException: r2, ...n2, event_id: e2 }), e2;
    }
    captureMessage(t2, n2, e2) {
      const r2 = this.G = e2 && e2.event_id ? e2.event_id : it(), i2 = new Error(t2);
      return this.getScope().captureMessage(t2, n2, { originalException: t2, syntheticException: i2, ...e2, event_id: r2 }), r2;
    }
    captureEvent(t2, n2) {
      const e2 = n2 && n2.event_id ? n2.event_id : it();
      return t2.type || (this.G = e2), this.getScope().captureEvent(t2, { ...n2, event_id: e2 }), e2;
    }
    lastEventId() {
      return this.G;
    }
    addBreadcrumb(t2, n2) {
      const { scope: e2, client: r2 } = this.getStackTop();
      if (!r2) return;
      const { beforeBreadcrumb: i2 = null, maxBreadcrumbs: o2 = Xn } = r2.getOptions && r2.getOptions() || {};
      if (o2 <= 0) return;
      const s2 = { timestamp: zt(), ...t2 }, c2 = i2 ? D(() => i2(s2, n2)) : s2;
      null !== c2 && (r2.emit && r2.emit("beforeAddBreadcrumb", c2, n2), e2.addBreadcrumb(c2, o2));
    }
    setUser(t2) {
      this.getScope().setUser(t2), this.getIsolationScope().setUser(t2);
    }
    setTags(t2) {
      this.getScope().setTags(t2), this.getIsolationScope().setTags(t2);
    }
    setExtras(t2) {
      this.getScope().setExtras(t2), this.getIsolationScope().setExtras(t2);
    }
    setTag(t2, n2) {
      this.getScope().setTag(t2, n2), this.getIsolationScope().setTag(t2, n2);
    }
    setExtra(t2, n2) {
      this.getScope().setExtra(t2, n2), this.getIsolationScope().setExtra(t2, n2);
    }
    setContext(t2, n2) {
      this.getScope().setContext(t2, n2), this.getIsolationScope().setContext(t2, n2);
    }
    configureScope(t2) {
      const { scope: n2, client: e2 } = this.getStackTop();
      e2 && t2(n2);
    }
    run(t2) {
      const n2 = Kn(this);
      try {
        t2(this);
      } finally {
        Kn(n2);
      }
    }
    getIntegration(t2) {
      const n2 = this.getClient();
      if (!n2) return null;
      try {
        return n2.getIntegration(t2);
      } catch (t3) {
        return null;
      }
    }
    startTransaction(t2, n2) {
      const e2 = this.J("startTransaction", t2, n2);
      return e2;
    }
    traceHeaders() {
      return this.J("traceHeaders");
    }
    captureSession(t2 = false) {
      if (t2) return this.endSession();
      this.K();
    }
    endSession() {
      const t2 = this.getStackTop().scope, n2 = t2.getSession();
      n2 && vn(n2), this.K(), t2.setSession();
    }
    startSession(t2) {
      const { scope: n2, client: e2 } = this.getStackTop(), { release: r2, environment: i2 = ln } = e2 && e2.getOptions() || {}, { userAgent: o2 } = $.navigator || {}, s2 = yn({ release: r2, environment: i2, user: n2.getUser(), ...o2 && { userAgent: o2 }, ...t2 }), c2 = n2.getSession && n2.getSession();
      return c2 && "ok" === c2.status && gn(c2, { status: "exited" }), this.endSession(), n2.setSession(s2), s2;
    }
    shouldSendDefaultPii() {
      const t2 = this.getClient(), n2 = t2 && t2.getOptions();
      return Boolean(n2 && n2.sendDefaultPii);
    }
    K() {
      const { scope: t2, client: n2 } = this.getStackTop(), e2 = t2.getSession();
      e2 && n2 && n2.captureSession && n2.captureSession(e2);
    }
    J(t2, ...n2) {
      const e2 = Jn().__SENTRY__;
      if (e2 && e2.extensions && "function" == typeof e2.extensions[t2]) return e2.extensions[t2].apply(this, n2);
    }
  }
  function Jn() {
    return $.__SENTRY__ = $.__SENTRY__ || { extensions: {}, hub: void 0 }, $;
  }
  function Kn(t2) {
    const n2 = Jn(), e2 = Qn(n2);
    return te(n2, t2), e2;
  }
  function Vn() {
    const t2 = Jn();
    if (t2.__SENTRY__ && t2.__SENTRY__.acs) {
      const n2 = t2.__SENTRY__.acs.getCurrentHub();
      if (n2) return n2;
    }
    return function(t3 = Jn()) {
      n2 = t3, n2 && n2.__SENTRY__ && n2.__SENTRY__.hub && !Qn(t3).isOlderThan(zn) || te(t3, new Gn());
      var n2;
      return Qn(t3);
    }(t2);
  }
  function Yn() {
    return Vn().getIsolationScope();
  }
  function Zn(t2, n2 = {}) {
    const e2 = Jn();
    return e2.__SENTRY__ && e2.__SENTRY__.acs ? e2.__SENTRY__.acs.runWithAsyncContext(t2, n2) : t2();
  }
  function Qn(t2) {
    return x("hub", () => new Gn(), t2);
  }
  function te(t2, n2) {
    if (!t2) return false;
    return (t2.__SENTRY__ = t2.__SENTRY__ || {}).hub = n2, true;
  }
  function ne(t2, n2, e2 = () => {
  }) {
    let r2;
    try {
      r2 = t2();
    } catch (t3) {
      throw n2(t3), e2(), t3;
    }
    return function(t3, n3, e3) {
      if (h(t3)) return t3.then((t4) => (e3(), t4), (t4) => {
        throw n3(t4), e3(), t4;
      });
      return e3(), t3;
    }(r2, n2, e2);
  }
  function ee(t2) {
    if ("boolean" == typeof __SENTRY_TRACING__ && !__SENTRY_TRACING__) return false;
    const n2 = On(), e2 = n2 && n2.getOptions();
    return !!e2 && (e2.enableTracing || "tracesSampleRate" in e2 || "tracesSampler" in e2);
  }
  function re() {
    return In().getSpan();
  }
  function ie(t2, n2, e2) {
    if (!ee()) return;
    const r2 = Yn(), i2 = In();
    let o2;
    if (n2) o2 = n2.startChild(e2);
    else {
      const { traceId: n3, dsc: s2, parentSpanId: c2, sampled: u2 } = { ...r2.getPropagationContext(), ...i2.getPropagationContext() };
      o2 = t2.startTransaction({ traceId: n3, parentSpanId: c2, parentSampled: u2, ...e2, metadata: { dynamicSamplingContext: s2, ...e2.metadata } });
    }
    return se(o2, i2, r2), o2;
  }
  function oe(t2) {
    if (t2.startTime) {
      const e2 = { ...t2 };
      return e2.startTimestamp = "number" == typeof (n2 = t2.startTime) ? bn(n2) : Array.isArray(n2) ? n2[0] + n2[1] / 1e9 : n2 instanceof Date ? bn(n2.getTime()) : Xt(), delete e2.startTime, e2;
    }
    var n2;
    return t2;
  }
  function se(t2, n2, e2) {
    t2 && (U(t2, "_sentryIsolationScope", e2), U(t2, "_sentryScope", n2));
  }
  let ce;
  function ue(t2, n2, e2, r2, i2, o2) {
    const s2 = re();
    if (s2) {
      const c2 = function(t3) {
        return ce ? ce.get(t3) : void 0;
      }(s2) || /* @__PURE__ */ new Map(), u2 = `${t2}:${n2}@${r2}`, a2 = c2.get(o2);
      if (a2) {
        const [, t3] = a2;
        c2.set(o2, [u2, { min: Math.min(t3.min, e2), max: Math.max(t3.max, e2), count: t3.count += 1, sum: t3.sum += e2, tags: t3.tags }]);
      } else c2.set(o2, [u2, { min: e2, max: e2, count: 1, sum: e2, tags: i2 }]);
      ce || (ce = /* @__PURE__ */ new WeakMap()), ce.set(s2, c2);
    }
  }
  function ae(t2, n2, e2, r2) {
    const i2 = sn(e2), o2 = t2.type && "replay_event" !== t2.type ? t2.type : "event";
    !function(t3, n3) {
      n3 && (t3.sdk = t3.sdk || {}, t3.sdk.name = t3.sdk.name || n3.name, t3.sdk.version = t3.sdk.version || n3.version, t3.sdk.integrations = [...t3.sdk.integrations || [], ...n3.integrations || []], t3.sdk.packages = [...t3.sdk.packages || [], ...n3.packages || []]);
    }(t2, e2 && e2.sdk);
    const s2 = function(t3, n3, e3, r3) {
      const i3 = t3.sdkProcessingMetadata && t3.sdkProcessingMetadata.dynamicSamplingContext;
      return { event_id: t3.event_id, sent_at: (/* @__PURE__ */ new Date()).toISOString(), ...n3 && { sdk: n3 }, ...!!e3 && r3 && { dsn: C(r3) }, ...i3 && { trace: z({ ...i3 }) } };
    }(t2, i2, r2, n2);
    delete t2.sdkProcessingMetadata;
    return Yt(s2, [[{ type: o2 }, t2]]);
  }
  function fe(t2) {
    const n2 = t2.protocol ? `${t2.protocol}:` : "", e2 = t2.port ? `:${t2.port}` : "";
    return `${n2}//${t2.host}${e2}${t2.path ? `/${t2.path}` : ""}/api/`;
  }
  function he(t2, n2) {
    return e2 = { sentry_key: t2.publicKey, sentry_version: "7", ...n2 && { sentry_client: `${n2.name}/${n2.version}` } }, Object.keys(e2).map((t3) => `${encodeURIComponent(t3)}=${encodeURIComponent(e2[t3])}`).join("&");
    var e2;
  }
  function le(t2, n2 = {}) {
    const e2 = "string" == typeof n2 ? n2 : n2.tunnel, r2 = "string" != typeof n2 && n2.V ? n2.V.sdk : void 0;
    return e2 || `${function(t3) {
      return `${fe(t3)}${t3.projectId}/envelope/`;
    }(t2)}?${he(t2, r2)}`;
  }
  const de = [];
  function pe(t2) {
    const n2 = t2.defaultIntegrations || [], e2 = t2.integrations;
    let r2;
    n2.forEach((t3) => {
      t3.isDefaultInstance = true;
    }), r2 = Array.isArray(e2) ? [...n2, ...e2] : "function" == typeof e2 ? ft(e2(n2)) : n2;
    const i2 = function(t3) {
      const n3 = {};
      return t3.forEach((t4) => {
        const { name: e3 } = t4, r3 = n3[e3];
        r3 && !r3.isDefaultInstance && t4.isDefaultInstance || (n3[e3] = t4);
      }), Object.keys(n3).map((t4) => n3[t4]);
    }(r2), o2 = function(t3, n3) {
      for (let e3 = 0; e3 < t3.length; e3++) if (true === n3(t3[e3])) return e3;
      return -1;
    }(i2, (t3) => "Debug" === t3.name);
    if (-1 !== o2) {
      const [t3] = i2.splice(o2, 1);
      i2.push(t3);
    }
    return i2;
  }
  function me(t2, n2) {
    for (const e2 of n2) e2 && e2.afterAllSetup && e2.afterAllSetup(t2);
  }
  function ye(t2, n2, e2) {
    if (!e2[n2.name]) {
      if (e2[n2.name] = n2, -1 === de.indexOf(n2.name) && (n2.setupOnce(pn, Vn), de.push(n2.name)), n2.setup && "function" == typeof n2.setup && n2.setup(t2), t2.on && "function" == typeof n2.preprocessEvent) {
        const e3 = n2.preprocessEvent.bind(n2);
        t2.on("preprocessEvent", (n3, r2) => e3(n3, r2, t2));
      }
      if (t2.addEventProcessor && "function" == typeof n2.processEvent) {
        const e3 = n2.processEvent.bind(n2), r2 = Object.assign((n3, r3) => e3(n3, r3, t2), { id: n2.name });
        t2.addEventProcessor(r2);
      }
    }
  }
  function ge(t2, n2) {
    return Object.assign(function(...t3) {
      return n2(...t3);
    }, { id: t2 });
  }
  const ve = /[^a-zA-Z0-9_/.-]+/g, _e = /[^\w\d\s_:/@.{}[\]$-]+/g;
  function be(t2, n2, e2, r2) {
    const i2 = { sent_at: (/* @__PURE__ */ new Date()).toISOString() };
    e2 && e2.sdk && (i2.sdk = { name: e2.sdk.name, version: e2.sdk.version }), r2 && n2 && (i2.dsn = C(n2));
    const o2 = function(t3) {
      const n3 = function(t4) {
        let n4 = "";
        for (const e3 of t4) {
          const t5 = Object.entries(e3.tags), r3 = t5.length > 0 ? `|#${t5.map(([t6, n5]) => `${t6}:${n5}`).join(",")}` : "";
          n4 += `${e3.name}@${e3.unit}:${e3.metric}|${e3.metricType}${r3}|T${e3.timestamp}
`;
        }
        return n4;
      }(t3);
      return [{ type: "statsd", length: n3.length }, n3];
    }(t2);
    return Yt(i2, [o2]);
  }
  function Ee(t2) {
    return void 0 === t2.type;
  }
  function we(t2) {
    return "transaction" === t2.type;
  }
  const $e = { c: class {
    constructor(t2) {
      this.v = t2;
    }
    get weight() {
      return 1;
    }
    add(t2) {
      this.v += t2;
    }
    toString() {
      return `${this.v}`;
    }
  }, g: class {
    constructor(t2) {
      this.Y = t2, this.Z = t2, this.tt = t2, this.nt = t2, this.et = 1;
    }
    get weight() {
      return 5;
    }
    add(t2) {
      this.Y = t2, t2 < this.Z && (this.Z = t2), t2 > this.tt && (this.tt = t2), this.nt += t2, this.et++;
    }
    toString() {
      return `${this.Y}:${this.Z}:${this.tt}:${this.nt}:${this.et}`;
    }
  }, d: class {
    constructor(t2) {
      this.v = [t2];
    }
    get weight() {
      return this.v.length;
    }
    add(t2) {
      this.v.push(t2);
    }
    toString() {
      return this.v.join(":");
    }
  }, s: class {
    constructor(t2) {
      this.first = t2, this.v = /* @__PURE__ */ new Set([t2]);
    }
    get weight() {
      return this.v.size;
    }
    add(t2) {
      this.v.add(t2);
    }
    toString() {
      return Array.from(this.v).map((t2) => "string" == typeof t2 ? function(t3) {
        let n2 = 0;
        for (let e2 = 0; e2 < t3.length; e2++) n2 = (n2 << 5) - n2 + t3.charCodeAt(e2), n2 &= n2;
        return n2 >>> 0;
      }(t2) : t2).join(":");
    }
  } };
  function Se(t2) {
    const n2 = Vn().getStackTop();
    n2.client = t2, n2.scope.setClient(t2);
  }
  function xe(t2, n2, e2 = Ft(t2.bufferSize || 30)) {
    let r2 = {};
    function i2(i3) {
      const o2 = [];
      if (Qt(i3, (n3, e3) => {
        const i4 = on(e3);
        if (function(t3, n4, e4 = Date.now()) {
          return function(t4, n5) {
            return t4[n5] || t4.all || 0;
          }(t3, n4) > e4;
        }(r2, i4)) {
          const r3 = ke(n3, e3);
          t2.recordDroppedEvent("ratelimit_backoff", i4, r3);
        } else o2.push(n3);
      }), 0 === o2.length) return Pt();
      const s2 = Yt(i3[0], o2), c2 = (n3) => {
        Qt(s2, (e3, r3) => {
          const i4 = ke(e3, r3);
          t2.recordDroppedEvent(n3, on(r3), i4);
        });
      };
      return e2.add(() => n2({ body: nn(s2, t2.textEncoder) }).then((t3) => (r2 = cn(r2, t3), t3), (t3) => {
        throw c2("network_error"), t3;
      })).then((t3) => t3, (t3) => {
        if (t3 instanceof L) return c2("queue_overflow"), Pt();
        throw t3;
      });
    }
    return i2.__sentry__baseTransport__ = true, { send: i2, flush: (t3) => e2.drain(t3) };
  }
  function ke(t2, n2) {
    if ("event" === n2 || "transaction" === n2) return Array.isArray(t2) ? t2[1] : void 0;
  }
  const Te = [/^Script error\.?$/, /^Javascript error: Script error\.? on line 0$/], je = [/^.*\/healthcheck$/, /^.*\/healthy$/, /^.*\/live$/, /^.*\/ready$/, /^.*\/heartbeat$/, /^.*\/health$/, /^.*\/healthz$/], Oe = "InboundFilters", Ie = (t2 = {}) => ({ name: Oe, setupOnce() {
  }, processEvent(n2, e2, r2) {
    const i2 = r2.getOptions(), o2 = function(t3 = {}, n3 = {}) {
      return { allowUrls: [...t3.allowUrls || [], ...n3.allowUrls || []], denyUrls: [...t3.denyUrls || [], ...n3.denyUrls || []], ignoreErrors: [...t3.ignoreErrors || [], ...n3.ignoreErrors || [], ...t3.disableErrorDefaults ? [] : Te], ignoreTransactions: [...t3.ignoreTransactions || [], ...n3.ignoreTransactions || [], ...t3.disableTransactionDefaults ? [] : je], ignoreInternal: void 0 === t3.ignoreInternal || t3.ignoreInternal };
    }(t2, i2);
    return function(t3, n3) {
      if (n3.ignoreInternal && function(t4) {
        try {
          return "SentryError" === t4.exception.values[0].type;
        } catch (t5) {
        }
        return false;
      }(t3)) return true;
      if (function(t4, n4) {
        if (t4.type || !n4 || !n4.length) return false;
        return function(t5) {
          const n5 = [];
          t5.message && n5.push(t5.message);
          let e3;
          try {
            e3 = t5.exception.values[t5.exception.values.length - 1];
          } catch (t6) {
          }
          e3 && e3.value && (n5.push(e3.value), e3.type && n5.push(`${e3.type}: ${e3.value}`));
          return n5;
        }(t4).some((t5) => g(t5, n4));
      }(t3, n3.ignoreErrors)) return true;
      if (function(t4, n4) {
        if ("transaction" !== t4.type || !n4 || !n4.length) return false;
        const e3 = t4.transaction;
        return !!e3 && g(e3, n4);
      }(t3, n3.ignoreTransactions)) return true;
      if (function(t4, n4) {
        if (!n4 || !n4.length) return false;
        const e3 = Me(t4);
        return !!e3 && g(e3, n4);
      }(t3, n3.denyUrls)) return true;
      if (!function(t4, n4) {
        if (!n4 || !n4.length) return true;
        const e3 = Me(t4);
        return !e3 || g(e3, n4);
      }(t3, n3.allowUrls)) return true;
      return false;
    }(n2, o2) ? null : n2;
  } }), De = ge(Oe, Ie);
  function Me(t2) {
    try {
      let n2;
      try {
        n2 = t2.exception.values[0].stacktrace.frames;
      } catch (t3) {
      }
      return n2 ? function(t3 = []) {
        for (let n3 = t3.length - 1; n3 >= 0; n3--) {
          const e2 = t3[n3];
          if (e2 && "<anonymous>" !== e2.filename && "[native code]" !== e2.filename) return e2.filename || null;
        }
        return null;
      }(n2) : null;
    } catch (t3) {
      return null;
    }
  }
  let Re;
  const Ce = "FunctionToString", Ae = /* @__PURE__ */ new WeakMap(), Ne = () => ({ name: Ce, setupOnce() {
    Re = Function.prototype.toString;
    try {
      Function.prototype.toString = function(...t2) {
        const n2 = F(this), e2 = Ae.has(On()) && void 0 !== n2 ? n2 : this;
        return Re.apply(e2, t2);
      };
    } catch (t2) {
    }
  }, setup(t2) {
    Ae.set(t2, true);
  } }), Le = ge(Ce, Ne), Pe = "LinkedErrors", Ue = ge(Pe, (t2 = {}) => {
    const n2 = t2.limit || 5, e2 = t2.key || "cause";
    return { name: Pe, setupOnce() {
    }, preprocessEvent(t3, r2, i2) {
      const o2 = i2.getOptions();
      v(un, o2.stackParser, o2.maxValueLength, e2, n2, t3, r2);
    } };
  });
  var Be = Object.freeze({ __proto__: null, FunctionToString: Le, InboundFilters: De, LinkedErrors: Ue });
  class Fe {
    constructor(t2) {
      this.F = t2, this.rt = /* @__PURE__ */ new Map(), this.it = setInterval(() => this.flush(), 5e3);
    }
    add(t2, n2, e2, r2 = "none", i2 = {}, o2 = Xt()) {
      const s2 = Math.floor(o2), c2 = n2.replace(ve, "_"), u2 = function(t3) {
        const n3 = {};
        for (const e3 in t3) Object.prototype.hasOwnProperty.call(t3, e3) && (n3[e3.replace(ve, "_")] = String(t3[e3]).replace(_e, ""));
        return n3;
      }(i2), a2 = function(t3, n3, e3, r3) {
        return `${t3}${n3}${e3}${Object.entries(z(r3)).sort((t4, n4) => t4[0].localeCompare(n4[0]))}`;
      }(t2, c2, r2, u2);
      let f2 = this.rt.get(a2);
      const h2 = f2 && "s" === t2 ? f2.metric.weight : 0;
      f2 ? (f2.metric.add(e2), f2.timestamp < s2 && (f2.timestamp = s2)) : (f2 = { metric: new $e[t2](e2), timestamp: s2, metricType: t2, name: c2, unit: r2, tags: u2 }, this.rt.set(a2, f2));
      ue(t2, c2, "string" == typeof e2 ? f2.metric.weight - h2 : e2, r2, i2, a2);
    }
    flush() {
      if (0 !== this.rt.size) {
        if (this.F.captureAggregateMetrics) {
          const t2 = Array.from(this.rt).map(([, t3]) => t3);
          this.F.captureAggregateMetrics(t2);
        }
        this.rt.clear();
      }
    }
    close() {
      clearInterval(this.it), this.flush();
    }
  }
  const He = "MetricsAggregator", qe = () => ({ name: He, setupOnce() {
  }, setup(t2) {
    t2.metricsAggregator = new Fe(t2);
  } });
  function We(t2, n2, e2, r2 = {}) {
    const i2 = On(), o2 = In();
    if (i2) {
      if (!i2.metricsAggregator) return;
      const { unit: s2, tags: c2, timestamp: u2 } = r2, { release: a2, environment: f2 } = i2.getOptions(), h2 = o2.getTransaction(), l2 = {};
      a2 && (l2.release = a2), f2 && (l2.environment = f2), h2 && (l2.transaction = En(h2).description || ""), i2.metricsAggregator.add(t2, n2, e2, s2, { ...l2, ...c2 }, u2);
    }
  }
  const ze = { increment: function(t2, n2 = 1, e2) {
    We("c", t2, n2, e2);
  }, distribution: function(t2, n2, e2) {
    We("d", t2, n2, e2);
  }, set: function(t2, n2, e2) {
    We("s", t2, n2, e2);
  }, gauge: function(t2, n2, e2) {
    We("g", t2, n2, e2);
  }, MetricsAggregator: ge(He, qe), metricsAggregatorIntegration: qe }, Xe = Be, Ge = $;
  let Je = 0;
  function Ke() {
    return Je > 0;
  }
  function Ve() {
    Je++, setTimeout(() => {
      Je--;
    });
  }
  function Ye(t2, n2 = {}, e2) {
    if ("function" != typeof t2) return t2;
    try {
      const n3 = t2.__sentry_wrapped__;
      if (n3) return n3;
      if (F(t2)) return t2;
    } catch (n3) {
      return t2;
    }
    const sentryWrapped = function() {
      const r2 = Array.prototype.slice.call(arguments);
      try {
        e2 && "function" == typeof e2 && e2.apply(this, arguments);
        const i2 = r2.map((t3) => Ye(t3, n2));
        return t2.apply(this, i2);
      } catch (t3) {
        throw Ve(), jn((e3) => {
          e3.addEventProcessor((t4) => (n2.mechanism && (ct(t4, void 0), ut(t4, n2.mechanism)), t4.extra = { ...t4.extra, arguments: r2 }, t4)), captureException(t3);
        }), t3;
      }
    };
    try {
      for (const n3 in t2) Object.prototype.hasOwnProperty.call(t2, n3) && (sentryWrapped[n3] = t2[n3]);
    } catch (t3) {
    }
    B(sentryWrapped, t2), U(t2, "__sentry_wrapped__", sentryWrapped);
    try {
      Object.getOwnPropertyDescriptor(sentryWrapped, "name").configurable && Object.defineProperty(sentryWrapped, "name", { get: () => t2.name });
    } catch (t3) {
    }
    return sentryWrapped;
  }
  function Ze(t2, n2) {
    const e2 = tr(t2, n2), r2 = { type: n2 && n2.name, value: er(n2) };
    return e2.length && (r2.stacktrace = { frames: e2 }), void 0 === r2.type && "" === r2.value && (r2.value = "Unrecoverable error caught"), r2;
  }
  function Qe(t2, n2) {
    return { exception: { values: [Ze(t2, n2)] } };
  }
  function tr(t2, n2) {
    const e2 = n2.stacktrace || n2.stack || "", r2 = function(t3) {
      if (t3) {
        if ("number" == typeof t3.framesToPop) return t3.framesToPop;
        if (nr.test(t3.message)) return 1;
      }
      return 0;
    }(n2);
    try {
      return t2(e2, r2);
    } catch (t3) {
    }
    return [];
  }
  const nr = /Minified React error #\d+;/i;
  function er(t2) {
    const n2 = t2 && t2.message;
    return n2 ? n2.error && "string" == typeof n2.error.message ? n2.error.message : n2 : "No error message";
  }
  function rr(t2, n2, e2, r2) {
    const i2 = or(t2, n2, e2 && e2.syntheticException || void 0, r2);
    return ut(i2), i2.level = "error", e2 && e2.event_id && (i2.event_id = e2.event_id), Pt(i2);
  }
  function ir(t2, n2, e2 = "info", r2, i2) {
    const o2 = sr(t2, n2, r2 && r2.syntheticException || void 0, i2);
    return o2.level = e2, r2 && r2.event_id && (o2.event_id = r2.event_id), Pt(o2);
  }
  function or(t2, n2, s2, c2, u2) {
    let h2;
    if (i(n2) && n2.error) {
      return Qe(t2, n2.error);
    }
    if (o(n2) || r(n2, "DOMException")) {
      const e2 = n2;
      if ("stack" in n2) h2 = Qe(t2, n2);
      else {
        const n3 = e2.name || (o(e2) ? "DOMError" : "DOMException"), r2 = e2.message ? `${n3}: ${e2.message}` : n3;
        h2 = sr(t2, r2, s2, c2), ct(h2, r2);
      }
      return "code" in e2 && (h2.tags = { ...h2.tags, "DOMException.code": `${e2.code}` }), h2;
    }
    if (e(n2)) return Qe(t2, n2);
    if (a(n2) || f(n2)) {
      return h2 = function(t3, n3, e2, r2) {
        const i2 = On(), o2 = i2 && i2.getOptions().normalizeDepth, s3 = { exception: { values: [{ type: f(n3) ? n3.constructor.name : r2 ? "UnhandledRejection" : "Error", value: cr(n3, { isUnhandledRejection: r2 }) }] }, extra: { __serialized__: At(n3, o2) } };
        if (e2) {
          const n4 = tr(t3, e2);
          n4.length && (s3.exception.values[0].stacktrace = { frames: n4 });
        }
        return s3;
      }(t2, n2, s2, u2), ut(h2, { synthetic: true }), h2;
    }
    return h2 = sr(t2, n2, s2, c2), ct(h2, `${n2}`), ut(h2, { synthetic: true }), h2;
  }
  function sr(t2, n2, e2, r2) {
    const i2 = {};
    if (r2 && e2) {
      const r3 = tr(t2, e2);
      r3.length && (i2.exception = { values: [{ value: n2, stacktrace: { frames: r3 } }] });
    }
    if (c(n2)) {
      const { __sentry_template_string__: t3, __sentry_template_values__: e3 } = n2;
      return i2.logentry = { message: t3, params: e3 }, i2;
    }
    return i2.message = n2, i2;
  }
  function cr(t2, { isUnhandledRejection: n2 }) {
    const e2 = function(t3, n3 = 40) {
      const e3 = Object.keys(H(t3));
      if (e3.sort(), !e3.length) return "[object has no keys]";
      if (e3[0].length >= n3) return p(e3[0], n3);
      for (let t4 = e3.length; t4 > 0; t4--) {
        const r3 = e3.slice(0, t4).join(", ");
        if (!(r3.length > n3)) return t4 === e3.length ? r3 : p(r3, n3);
      }
      return "";
    }(t2), r2 = n2 ? "promise rejection" : "exception";
    if (i(t2)) return `Event \`ErrorEvent\` captured as ${r2} with message \`${t2.message}\``;
    if (f(t2)) {
      return `Event \`${function(t3) {
        try {
          const n3 = Object.getPrototypeOf(t3);
          return n3 ? n3.constructor.name : void 0;
        } catch (t4) {
        }
      }(t2)}\` (type=${t2.type}) captured as ${r2}`;
    }
    return `Object captured as ${r2} with keys: ${e2}`;
  }
  function ur(t2, { metadata: n2, tunnel: e2, dsn: r2 }) {
    const i2 = { event_id: t2.event_id, sent_at: (/* @__PURE__ */ new Date()).toISOString(), ...n2 && n2.sdk && { sdk: { name: n2.sdk.name, version: n2.sdk.version } }, ...!!e2 && !!r2 && { dsn: C(r2) } }, o2 = /* @__PURE__ */ function(t3) {
      return [{ type: "user_report" }, t3];
    }(t2);
    return Yt(i2, [o2]);
  }
  class ar extends class {
    constructor(t2) {
      if (this.ot = t2, this._integrations = {}, this.st = false, this.ct = 0, this.ut = {}, this.ft = {}, this.k = [], t2.dsn && (this.ht = N(t2.dsn)), this.ht) {
        const n2 = le(this.ht, t2);
        this.lt = t2.transport({ recordDroppedEvent: this.recordDroppedEvent.bind(this), ...t2.transportOptions, url: n2 });
      }
    }
    captureException(t2, n2, e2) {
      if (at(t2)) return;
      let r2 = n2 && n2.event_id;
      return this.dt(this.eventFromException(t2, n2).then((t3) => this.yt(t3, n2, e2)).then((t3) => {
        r2 = t3;
      })), r2;
    }
    captureMessage(t2, n2, e2, r2) {
      let i2 = e2 && e2.event_id;
      const o2 = c(t2) ? t2 : String(t2), s2 = u(t2) ? this.eventFromMessage(o2, n2, e2) : this.eventFromException(t2, e2);
      return this.dt(s2.then((t3) => this.yt(t3, e2, r2)).then((t3) => {
        i2 = t3;
      })), i2;
    }
    captureEvent(t2, n2, e2) {
      if (n2 && n2.originalException && at(n2.originalException)) return;
      let r2 = n2 && n2.event_id;
      const i2 = (t2.sdkProcessingMetadata || {}).capturedSpanScope;
      return this.dt(this.yt(t2, n2, i2 || e2).then((t3) => {
        r2 = t3;
      })), r2;
    }
    captureSession(t2) {
      "string" != typeof t2.release || (this.sendSession(t2), gn(t2, { init: false }));
    }
    getDsn() {
      return this.ht;
    }
    getOptions() {
      return this.ot;
    }
    getSdkMetadata() {
      return this.ot.V;
    }
    getTransport() {
      return this.lt;
    }
    flush(t2) {
      const n2 = this.lt;
      return n2 ? (this.metricsAggregator && this.metricsAggregator.flush(), this.gt(t2).then((e2) => n2.flush(t2).then((t3) => e2 && t3))) : Pt(true);
    }
    close(t2) {
      return this.flush(t2).then((t3) => (this.getOptions().enabled = false, this.metricsAggregator && this.metricsAggregator.close(), t3));
    }
    getEventProcessors() {
      return this.k;
    }
    addEventProcessor(t2) {
      this.k.push(t2);
    }
    setupIntegrations(t2) {
      (t2 && !this.st || this.vt() && !this.st) && this._t();
    }
    init() {
      this.vt() && this._t();
    }
    getIntegrationById(t2) {
      return this.getIntegrationByName(t2);
    }
    getIntegrationByName(t2) {
      return this._integrations[t2];
    }
    getIntegration(t2) {
      try {
        return this._integrations[t2.id] || null;
      } catch (t3) {
        return null;
      }
    }
    addIntegration(t2) {
      const n2 = this._integrations[t2.name];
      ye(this, t2, this._integrations), n2 || me(this, [t2]);
    }
    sendEvent(t2, n2 = {}) {
      this.emit("beforeSendEvent", t2, n2);
      let e2 = ae(t2, this.ht, this.ot.V, this.ot.tunnel);
      for (const t3 of n2.attachments || []) e2 = Zt(e2, en(t3, this.ot.transportOptions && this.ot.transportOptions.textEncoder));
      const r2 = this.bt(e2);
      r2 && r2.then((n3) => this.emit("afterSendEvent", t2, n3), null);
    }
    sendSession(t2) {
      const n2 = function(t3, n3, e2, r2) {
        const i2 = sn(e2);
        return Yt({ sent_at: (/* @__PURE__ */ new Date()).toISOString(), ...i2 && { sdk: i2 }, ...!!r2 && n3 && { dsn: C(n3) } }, ["aggregates" in t3 ? [{ type: "sessions" }, t3] : [{ type: "session" }, t3.toJSON()]]);
      }(t2, this.ht, this.ot.V, this.ot.tunnel);
      this.bt(n2);
    }
    recordDroppedEvent(t2, n2, e2) {
      if (this.ot.sendClientReports) {
        const e3 = `${t2}:${n2}`;
        this.ut[e3] = this.ut[e3] + 1 || 1;
      }
    }
    captureAggregateMetrics(t2) {
      const n2 = be(t2, this.ht, this.ot.V, this.ot.tunnel);
      this.bt(n2);
    }
    on(t2, n2) {
      this.ft[t2] || (this.ft[t2] = []), this.ft[t2].push(n2);
    }
    emit(t2, ...n2) {
      this.ft[t2] && this.ft[t2].forEach((t3) => t3(...n2));
    }
    _t() {
      const { integrations: t2 } = this.ot;
      this._integrations = function(t3, n2) {
        const e2 = {};
        return n2.forEach((n3) => {
          n3 && ye(t3, n3, e2);
        }), e2;
      }(this, t2), me(this, t2), this.st = true;
    }
    Et(t2, n2) {
      let e2 = false, r2 = false;
      const i2 = n2.exception && n2.exception.values;
      if (i2) {
        r2 = true;
        for (const t3 of i2) {
          const n3 = t3.mechanism;
          if (n3 && false === n3.handled) {
            e2 = true;
            break;
          }
        }
      }
      const o2 = "ok" === t2.status;
      (o2 && 0 === t2.errors || o2 && e2) && (gn(t2, { ...e2 && { status: "crashed" }, errors: t2.errors || Number(r2 || e2) }), this.captureSession(t2));
    }
    gt(t2) {
      return new Bt((n2) => {
        let e2 = 0;
        const r2 = setInterval(() => {
          0 == this.ct ? (clearInterval(r2), n2(true)) : (e2 += 1, t2 && e2 >= t2 && (clearInterval(r2), n2(false)));
        }, 1);
      });
    }
    vt() {
      return false !== this.getOptions().enabled && void 0 !== this.lt;
    }
    wt(t2, n2, e2, r2 = Yn()) {
      const i2 = this.getOptions(), o2 = Object.keys(this._integrations);
      return !n2.integrations && o2.length > 0 && (n2.integrations = o2), this.emit("preprocessEvent", t2, n2), wn(i2, t2, n2, e2, this, r2).then((t3) => {
        if (null === t3) return t3;
        const n3 = { ...r2.getPropagationContext(), ...e2 ? e2.getPropagationContext() : void 0 };
        if (!(t3.contexts && t3.contexts.trace) && n3) {
          const { traceId: r3, spanId: i3, parentSpanId: o3, dsc: s2 } = n3;
          t3.contexts = { trace: { trace_id: r3, span_id: i3, parent_span_id: o3 }, ...t3.contexts };
          const c2 = s2 || Nn(r3, this, e2);
          t3.sdkProcessingMetadata = { dynamicSamplingContext: c2, ...t3.sdkProcessingMetadata };
        }
        return t3;
      });
    }
    yt(t2, n2 = {}, e2) {
      return this.$t(t2, n2, e2).then((t3) => t3.event_id, (t3) => {
      });
    }
    $t(t2, n2, e2) {
      const r2 = this.getOptions(), { sampleRate: i2 } = r2, o2 = we(t2), s2 = Ee(t2), c2 = t2.type || "error", u2 = `before send for type \`${c2}\``;
      if (s2 && "number" == typeof i2 && Math.random() > i2) return this.recordDroppedEvent("sample_rate", "error", t2), Ut(new L(`Discarding event because it's not included in the random sample (sampling rate = ${i2})`, "log"));
      const f2 = "replay_event" === c2 ? "replay" : c2, l2 = (t2.sdkProcessingMetadata || {}).capturedSpanIsolationScope;
      return this.wt(t2, n2, e2, l2).then((e3) => {
        if (null === e3) throw this.recordDroppedEvent("event_processor", f2, t2), new L("An event processor returned `null`, will not send event.", "log");
        if (n2.data && true === n2.data.__sentry__) return e3;
        const i3 = function(t3, n3, e4) {
          const { beforeSend: r3, beforeSendTransaction: i4 } = t3;
          if (Ee(n3) && r3) return r3(n3, e4);
          if (we(n3) && i4) return i4(n3, e4);
          return n3;
        }(r2, e3, n2);
        return function(t3, n3) {
          const e4 = `${n3} must return \`null\` or a valid event.`;
          if (h(t3)) return t3.then((t4) => {
            if (!a(t4) && null !== t4) throw new L(e4);
            return t4;
          }, (t4) => {
            throw new L(`${n3} rejected with ${t4}`);
          });
          if (!a(t3) && null !== t3) throw new L(e4);
          return t3;
        }(i3, u2);
      }).then((r3) => {
        if (null === r3) throw this.recordDroppedEvent("before_send", f2, t2), new L(`${u2} returned \`null\`, will not send event.`, "log");
        const i3 = e2 && e2.getSession();
        !o2 && i3 && this.Et(i3, r3);
        const s3 = r3.transaction_info;
        if (o2 && s3 && r3.transaction !== t2.transaction) {
          const t3 = "custom";
          r3.transaction_info = { ...s3, source: t3 };
        }
        return this.sendEvent(r3, n2), r3;
      }).then(null, (t3) => {
        if (t3 instanceof L) throw t3;
        throw this.captureException(t3, { data: { __sentry__: true }, originalException: t3 }), new L(`Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${t3}`);
      });
    }
    dt(t2) {
      this.ct++, t2.then((t3) => (this.ct--, t3), (t3) => (this.ct--, t3));
    }
    bt(t2) {
      if (this.emit("beforeEnvelope", t2), this.vt() && this.lt) return this.lt.send(t2).then(null, (t3) => {
      });
    }
    St() {
      const t2 = this.ut;
      return this.ut = {}, Object.keys(t2).map((n2) => {
        const [e2, r2] = n2.split(":");
        return { reason: e2, category: r2, quantity: t2[n2] };
      });
    }
  } {
    constructor(t2) {
      !function(t3, n2, e2 = [n2], r2 = "npm") {
        const i2 = t3.V || {};
        i2.sdk || (i2.sdk = { name: `sentry.javascript.${n2}`, packages: e2.map((t4) => ({ name: `${r2}:@sentry/${t4}`, version: Wn })), version: Wn }), t3.V = i2;
      }(t2, "browser", ["browser"], Ge.SENTRY_SDK_SOURCE || "npm"), super(t2), t2.sendClientReports && Ge.document && Ge.document.addEventListener("visibilitychange", () => {
        "hidden" === Ge.document.visibilityState && this.xt();
      });
    }
    eventFromException(t2, n2) {
      return rr(this.ot.stackParser, t2, n2, this.ot.attachStacktrace);
    }
    eventFromMessage(t2, n2 = "info", e2) {
      return ir(this.ot.stackParser, t2, n2, e2, this.ot.attachStacktrace);
    }
    captureUserFeedback(t2) {
      if (!this.vt()) return;
      const n2 = ur(t2, { metadata: this.getSdkMetadata(), dsn: this.getDsn(), tunnel: this.getOptions().tunnel });
      this.bt(n2);
    }
    wt(t2, n2, e2) {
      return t2.platform = t2.platform || "javascript", super.wt(t2, n2, e2);
    }
    xt() {
      const t2 = this.St();
      if (0 === t2.length) return;
      if (!this.ht) return;
      const n2 = (e2 = t2, Yt((r2 = this.ot.tunnel && C(this.ht)) ? { dsn: r2 } : {}, [[{ type: "client_report" }, { timestamp: i2 || zt(), discarded_events: e2 }]]));
      var e2, r2, i2;
      this.bt(n2);
    }
  }
  let fr;
  function hr(t2, n2 = function() {
    if (fr) return fr;
    if (_t(Ge.fetch)) return fr = Ge.fetch.bind(Ge);
    const t3 = Ge.document;
    let n3 = Ge.fetch;
    if (t3 && "function" == typeof t3.createElement) try {
      const e2 = t3.createElement("iframe");
      e2.hidden = true, t3.head.appendChild(e2);
      const r2 = e2.contentWindow;
      r2 && r2.fetch && (n3 = r2.fetch), t3.head.removeChild(e2);
    } catch (t4) {
    }
    return fr = n3.bind(Ge);
  }()) {
    let e2 = 0, r2 = 0;
    return xe(t2, function(i2) {
      const o2 = i2.body.length;
      e2 += o2, r2++;
      const s2 = { body: i2.body, method: "POST", referrerPolicy: "origin", headers: t2.headers, keepalive: e2 <= 6e4 && r2 < 15, ...t2.fetchOptions };
      try {
        return n2(t2.url, s2).then((t3) => (e2 -= o2, r2--, { statusCode: t3.status, headers: { "x-sentry-rate-limits": t3.headers.get("X-Sentry-Rate-Limits"), "retry-after": t3.headers.get("Retry-After") } }));
      } catch (t3) {
        return fr = void 0, e2 -= o2, r2--, Ut(t3);
      }
    });
  }
  function lr(t2) {
    return xe(t2, function(n2) {
      return new Bt((e2, r2) => {
        const i2 = new XMLHttpRequest();
        i2.onerror = r2, i2.onreadystatechange = () => {
          4 === i2.readyState && e2({ statusCode: i2.status, headers: { "x-sentry-rate-limits": i2.getResponseHeader("X-Sentry-Rate-Limits"), "retry-after": i2.getResponseHeader("Retry-After") } });
        }, i2.open("POST", t2.url);
        for (const n3 in t2.headers) Object.prototype.hasOwnProperty.call(t2.headers, n3) && i2.setRequestHeader(n3, t2.headers[n3]);
        i2.send(n2.body);
      });
    });
  }
  const dr = "?";
  function pr(t2, n2, e2, r2) {
    const i2 = { filename: t2, function: n2, in_app: true };
    return void 0 !== e2 && (i2.lineno = e2), void 0 !== r2 && (i2.colno = r2), i2;
  }
  const mr = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i, yr = /\((\S*)(?::(\d+))(?::(\d+))\)/, gr = [30, (t2) => {
    const n2 = mr.exec(t2);
    if (n2) {
      if (n2[2] && 0 === n2[2].indexOf("eval")) {
        const t4 = yr.exec(n2[2]);
        t4 && (n2[2] = t4[1], n2[3] = t4[2], n2[4] = t4[3]);
      }
      const [t3, e2] = Or(n2[1] || dr, n2[2]);
      return pr(e2, t3, n2[3] ? +n2[3] : void 0, n2[4] ? +n2[4] : void 0);
    }
  }], vr = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i, _r = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i, br = [50, (t2) => {
    const n2 = vr.exec(t2);
    if (n2) {
      if (n2[3] && n2[3].indexOf(" > eval") > -1) {
        const t4 = _r.exec(n2[3]);
        t4 && (n2[1] = n2[1] || "eval", n2[3] = t4[1], n2[4] = t4[2], n2[5] = "");
      }
      let t3 = n2[3], e2 = n2[1] || dr;
      return [e2, t3] = Or(e2, t3), pr(t3, e2, n2[4] ? +n2[4] : void 0, n2[5] ? +n2[5] : void 0);
    }
  }], Er = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:[-a-z]+):.*?):(\d+)(?::(\d+))?\)?\s*$/i, wr = [40, (t2) => {
    const n2 = Er.exec(t2);
    return n2 ? pr(n2[2], n2[1] || dr, +n2[3], n2[4] ? +n2[4] : void 0) : void 0;
  }], $r = / line (\d+).*script (?:in )?(\S+)(?:: in function (\S+))?$/i, Sr = [10, (t2) => {
    const n2 = $r.exec(t2);
    return n2 ? pr(n2[2], n2[3] || dr, +n2[1]) : void 0;
  }], xr = / line (\d+), column (\d+)\s*(?:in (?:<anonymous function: ([^>]+)>|([^)]+))\(.*\))? in (.*):\s*$/i, kr = [20, (t2) => {
    const n2 = xr.exec(t2);
    return n2 ? pr(n2[5], n2[3] || n2[4] || dr, +n2[1], +n2[2]) : void 0;
  }], Tr = [gr, br, wr], jr = K(...Tr), Or = (t2, n2) => {
    const e2 = -1 !== t2.indexOf("safari-extension"), r2 = -1 !== t2.indexOf("safari-web-extension");
    return e2 || r2 ? [-1 !== t2.indexOf("@") ? t2.split("@")[0] : dr, e2 ? `safari-extension:${n2}` : `safari-web-extension:${n2}`] : [t2, n2];
  }, Ir = 1024, Dr = "Breadcrumbs", Mr = (t2 = {}) => {
    const n2 = { console: true, dom: true, fetch: true, history: true, sentry: true, xhr: true, ...t2 };
    return { name: Dr, setupOnce() {
    }, setup(t3) {
      var e2;
      n2.console && function(t4) {
        const n3 = "console";
        tt(n3, t4), nt(n3, rt);
      }(/* @__PURE__ */ function(t4) {
        return function(n3) {
          if (On() !== t4) return;
          const e3 = { category: "console", data: { arguments: n3.args, logger: "console" }, level: Wt(n3.level), message: m(n3.args, " ") };
          if ("assert" === n3.level) {
            if (false !== n3.args[0]) return;
            e3.message = `Assertion failed: ${m(n3.args.slice(1), " ") || "console.assert"}`, e3.data.arguments = n3.args.slice(1);
          }
          Tn(e3, { input: n3.args, level: n3.level });
        };
      }(t3)), n2.dom && (e2 = /* @__PURE__ */ function(t4, n3) {
        return function(e3) {
          if (On() !== t4) return;
          let r2, i2, o2 = "object" == typeof n3 ? n3.serializeAttribute : void 0, s2 = "object" == typeof n3 && "number" == typeof n3.maxStringLength ? n3.maxStringLength : void 0;
          s2 && s2 > Ir && (s2 = Ir), "string" == typeof o2 && (o2 = [o2]);
          try {
            const t5 = e3.event, n4 = function(t6) {
              return !!t6 && !!t6.target;
            }(t5) ? t5.target : t5;
            r2 = T(n4, { keyAttrs: o2, maxStringLength: s2 }), i2 = function(t6) {
              if (!k.HTMLElement) return null;
              let n5 = t6;
              for (let t7 = 0; t7 < 5; t7++) {
                if (!n5) return null;
                if (n5 instanceof HTMLElement && n5.dataset.sentryComponent) return n5.dataset.sentryComponent;
                n5 = n5.parentNode;
              }
              return null;
            }(n4);
          } catch (t5) {
            r2 = "<unknown>";
          }
          if (0 === r2.length) return;
          const c2 = { category: `ui.${e3.name}`, message: r2 };
          i2 && (c2.data = { "ui.component_name": i2 }), Tn(c2, { event: e3.event, name: e3.name, global: e3.global });
        };
      }(t3, n2.dom), tt("dom", e2), nt("dom", mt)), n2.xhr && function(t4) {
        tt("xhr", t4), nt("xhr", Rt);
      }(/* @__PURE__ */ function(t4) {
        return function(n3) {
          if (On() !== t4) return;
          const { startTimestamp: e3, endTimestamp: r2 } = n3, i2 = n3.xhr.__sentry_xhr_v3__;
          if (!e3 || !r2 || !i2) return;
          const { method: o2, url: s2, status_code: c2, body: u2 } = i2;
          Tn({ category: "xhr", data: { method: o2, url: s2, status_code: c2 }, type: "http" }, { xhr: n3.xhr, input: u2, startTimestamp: e3, endTimestamp: r2 });
        };
      }(t3)), n2.fetch && function(t4) {
        const n3 = "fetch";
        tt(n3, t4), nt(n3, bt);
      }(/* @__PURE__ */ function(t4) {
        return function(n3) {
          if (On() !== t4) return;
          const { startTimestamp: e3, endTimestamp: r2 } = n3;
          if (r2 && (!n3.fetchData.url.match(/sentry_key/) || "POST" !== n3.fetchData.method)) if (n3.error) {
            Tn({ category: "fetch", data: n3.fetchData, level: "error", type: "http" }, { data: n3.error, input: n3.args, startTimestamp: e3, endTimestamp: r2 });
          } else {
            const t5 = n3.response;
            Tn({ category: "fetch", data: { ...n3.fetchData, status_code: t5 && t5.status }, type: "http" }, { input: n3.args, response: t5, startTimestamp: e3, endTimestamp: r2 });
          }
        };
      }(t3)), n2.history && It(/* @__PURE__ */ function(t4) {
        return function(n3) {
          if (On() !== t4) return;
          let e3 = n3.from, r2 = n3.to;
          const i2 = Ht(Ge.location.href);
          let o2 = e3 ? Ht(e3) : void 0;
          const s2 = Ht(r2);
          o2 && o2.path || (o2 = i2), i2.protocol === s2.protocol && i2.host === s2.host && (r2 = s2.relative), i2.protocol === o2.protocol && i2.host === o2.host && (e3 = o2.relative), Tn({ category: "navigation", data: { from: e3, to: r2 } });
        };
      }(t3)), n2.sentry && t3.on && t3.on("beforeSendEvent", /* @__PURE__ */ function(t4) {
        return function(n3) {
          On() === t4 && Tn({ category: "sentry." + ("transaction" === n3.type ? "transaction" : "event"), event_id: n3.event_id, level: n3.level, message: st(n3) }, { event: n3 });
        };
      }(t3));
    } };
  }, Rr = ge(Dr, Mr);
  const Cr = "Dedupe", Ar = () => {
    let t2;
    return { name: Cr, setupOnce() {
    }, processEvent(n2) {
      if (n2.type) return n2;
      try {
        if (function(t3, n3) {
          if (!n3) return false;
          if (function(t4, n4) {
            const e2 = t4.message, r2 = n4.message;
            if (!e2 && !r2) return false;
            if (e2 && !r2 || !e2 && r2) return false;
            if (e2 !== r2) return false;
            if (!Pr(t4, n4)) return false;
            if (!Lr(t4, n4)) return false;
            return true;
          }(t3, n3)) return true;
          if (function(t4, n4) {
            const e2 = Ur(n4), r2 = Ur(t4);
            if (!e2 || !r2) return false;
            if (e2.type !== r2.type || e2.value !== r2.value) return false;
            if (!Pr(t4, n4)) return false;
            if (!Lr(t4, n4)) return false;
            return true;
          }(t3, n3)) return true;
          return false;
        }(n2, t2)) return null;
      } catch (t3) {
      }
      return t2 = n2;
    } };
  }, Nr = ge(Cr, Ar);
  function Lr(t2, n2) {
    let e2 = Br(t2), r2 = Br(n2);
    if (!e2 && !r2) return true;
    if (e2 && !r2 || !e2 && r2) return false;
    if (e2 = e2, r2 = r2, r2.length !== e2.length) return false;
    for (let t3 = 0; t3 < r2.length; t3++) {
      const n3 = r2[t3], i2 = e2[t3];
      if (n3.filename !== i2.filename || n3.lineno !== i2.lineno || n3.colno !== i2.colno || n3.function !== i2.function) return false;
    }
    return true;
  }
  function Pr(t2, n2) {
    let e2 = t2.fingerprint, r2 = n2.fingerprint;
    if (!e2 && !r2) return true;
    if (e2 && !r2 || !e2 && r2) return false;
    e2 = e2, r2 = r2;
    try {
      return !(e2.join("") !== r2.join(""));
    } catch (t3) {
      return false;
    }
  }
  function Ur(t2) {
    return t2.exception && t2.exception.values && t2.exception.values[0];
  }
  function Br(t2) {
    const n2 = t2.exception;
    if (n2) try {
      return n2.values[0].stacktrace.frames;
    } catch (t3) {
      return;
    }
  }
  const Fr = "GlobalHandlers", Hr = (t2 = {}) => {
    const n2 = { onerror: true, onunhandledrejection: true, ...t2 };
    return { name: Fr, setupOnce() {
      Error.stackTraceLimit = 50;
    }, setup(t3) {
      n2.onerror && function(t4) {
        !function(t5) {
          const n3 = "error";
          tt(n3, t5), nt(n3, St);
        }((n3) => {
          const { stackParser: e2, attachStacktrace: r2 } = zr();
          if (On() !== t4 || Ke()) return;
          const { msg: o2, url: c2, line: u2, column: a2, error: f2 } = n3, h2 = void 0 === f2 && s(o2) ? function(t5, n4, e3, r3) {
            const o3 = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
            let s2 = i(t5) ? t5.message : t5, c3 = "Error";
            const u3 = s2.match(o3);
            u3 && (c3 = u3[1], s2 = u3[2]);
            return Wr({ exception: { values: [{ type: c3, value: s2 }] } }, n4, e3, r3);
          }(o2, c2, u2, a2) : Wr(or(e2, f2 || o2, void 0, r2, false), c2, u2, a2);
          h2.level = "error", kn(h2, { originalException: f2, mechanism: { handled: false, type: "onerror" } });
        });
      }(t3), n2.onunhandledrejection && function(t4) {
        !function(t5) {
          const n3 = "unhandledrejection";
          tt(n3, t5), nt(n3, kt);
        }((n3) => {
          const { stackParser: e2, attachStacktrace: r2 } = zr();
          if (On() !== t4 || Ke()) return;
          const i2 = function(t5) {
            if (u(t5)) return t5;
            const n4 = t5;
            try {
              if ("reason" in n4) return n4.reason;
              if ("detail" in n4 && "reason" in n4.detail) return n4.detail.reason;
            } catch (t6) {
            }
            return t5;
          }(n3), o2 = u(i2) ? { exception: { values: [{ type: "UnhandledRejection", value: `Non-Error promise rejection captured with value: ${String(i2)}` }] } } : or(e2, i2, void 0, r2, true);
          o2.level = "error", kn(o2, { originalException: i2, mechanism: { handled: false, type: "onunhandledrejection" } });
        });
      }(t3);
    } };
  }, qr = ge(Fr, Hr);
  function Wr(t2, n2, e2, r2) {
    const i2 = t2.exception = t2.exception || {}, o2 = i2.values = i2.values || [], c2 = o2[0] = o2[0] || {}, u2 = c2.stacktrace = c2.stacktrace || {}, a2 = u2.frames = u2.frames || [], f2 = isNaN(parseInt(r2, 10)) ? void 0 : r2, h2 = isNaN(parseInt(e2, 10)) ? void 0 : e2, l2 = s(n2) && n2.length > 0 ? n2 : function() {
      try {
        return k.document.location.href;
      } catch (t3) {
        return "";
      }
    }();
    return 0 === a2.length && a2.push({ colno: f2, filename: l2, function: "?", in_app: true, lineno: h2 }), t2;
  }
  function zr() {
    const t2 = On();
    return t2 && t2.getOptions() || { stackParser: () => [], attachStacktrace: false };
  }
  const Xr = "HttpContext", Gr = () => ({ name: Xr, setupOnce() {
  }, preprocessEvent(t2) {
    if (!Ge.navigator && !Ge.location && !Ge.document) return;
    const n2 = t2.request && t2.request.url || Ge.location && Ge.location.href, { referrer: e2 } = Ge.document || {}, { userAgent: r2 } = Ge.navigator || {}, i2 = { ...t2.request && t2.request.headers, ...e2 && { Referer: e2 }, ...r2 && { "User-Agent": r2 } }, o2 = { ...t2.request, ...n2 && { url: n2 }, headers: i2 };
    t2.request = o2;
  } }), Jr = ge(Xr, Gr), Kr = "LinkedErrors", Vr = (t2 = {}) => {
    const n2 = t2.limit || 5, e2 = t2.key || "cause";
    return { name: Kr, setupOnce() {
    }, preprocessEvent(t3, r2, i2) {
      const o2 = i2.getOptions();
      v(Ze, o2.stackParser, o2.maxValueLength, e2, n2, t3, r2);
    } };
  }, Yr = ge(Kr, Vr), Zr = ["EventTarget", "Window", "Node", "ApplicationCache", "AudioTrackList", "BroadcastChannel", "ChannelMergerNode", "CryptoOperation", "EventSource", "FileReader", "HTMLUnknownElement", "IDBDatabase", "IDBRequest", "IDBTransaction", "KeyOperation", "MediaController", "MessagePort", "ModalWindow", "Notification", "SVGElementInstance", "Screen", "SharedWorker", "TextTrack", "TextTrackCue", "TextTrackList", "WebSocket", "WebSocketWorker", "Worker", "XMLHttpRequest", "XMLHttpRequestEventTarget", "XMLHttpRequestUpload"], Qr = "TryCatch", ti = (t2 = {}) => {
    const n2 = { XMLHttpRequest: true, eventTarget: true, requestAnimationFrame: true, setInterval: true, setTimeout: true, ...t2 };
    return { name: Qr, setupOnce() {
      n2.setTimeout && P(Ge, "setTimeout", ei), n2.setInterval && P(Ge, "setInterval", ei), n2.requestAnimationFrame && P(Ge, "requestAnimationFrame", ri), n2.XMLHttpRequest && "XMLHttpRequest" in Ge && P(XMLHttpRequest.prototype, "send", ii);
      const t3 = n2.eventTarget;
      if (t3) {
        (Array.isArray(t3) ? t3 : Zr).forEach(oi);
      }
    } };
  }, ni = ge(Qr, ti);
  function ei(t2) {
    return function(...n2) {
      const e2 = n2[0];
      return n2[0] = Ye(e2, { mechanism: { data: { function: Y(t2) }, handled: false, type: "instrument" } }), t2.apply(this, n2);
    };
  }
  function ri(t2) {
    return function(n2) {
      return t2.apply(this, [Ye(n2, { mechanism: { data: { function: "requestAnimationFrame", handler: Y(t2) }, handled: false, type: "instrument" } })]);
    };
  }
  function ii(t2) {
    return function(...n2) {
      const e2 = this;
      return ["onload", "onerror", "onprogress", "onreadystatechange"].forEach((t3) => {
        t3 in e2 && "function" == typeof e2[t3] && P(e2, t3, function(n3) {
          const e3 = { mechanism: { data: { function: t3, handler: Y(n3) }, handled: false, type: "instrument" } }, r2 = F(n3);
          return r2 && (e3.mechanism.data.handler = Y(r2)), Ye(n3, e3);
        });
      }), t2.apply(this, n2);
    };
  }
  function oi(t2) {
    const n2 = Ge, e2 = n2[t2] && n2[t2].prototype;
    e2 && e2.hasOwnProperty && e2.hasOwnProperty("addEventListener") && (P(e2, "addEventListener", function(n3) {
      return function(e3, r2, i2) {
        try {
          "function" == typeof r2.handleEvent && (r2.handleEvent = Ye(r2.handleEvent, { mechanism: { data: { function: "handleEvent", handler: Y(r2), target: t2 }, handled: false, type: "instrument" } }));
        } catch (t3) {
        }
        return n3.apply(this, [e3, Ye(r2, { mechanism: { data: { function: "addEventListener", handler: Y(r2), target: t2 }, handled: false, type: "instrument" } }), i2]);
      };
    }), P(e2, "removeEventListener", function(t3) {
      return function(n3, e3, r2) {
        const i2 = e3;
        try {
          const e4 = i2 && i2.__sentry_wrapped__;
          e4 && t3.call(this, n3, e4, r2);
        } catch (t4) {
        }
        return t3.call(this, n3, i2, r2);
      };
    }));
  }
  const si = [Ie(), Ne(), ti(), Mr(), Hr(), Vr(), Ar(), Gr()];
  function ci(t2) {
    return [...si];
  }
  var ui = Object.freeze({ __proto__: null, GlobalHandlers: qr, TryCatch: ni, Breadcrumbs: Rr, LinkedErrors: Yr, HttpContext: Jr, Dedupe: Nr });
  let ai = {};
  Ge.Sentry && Ge.Sentry.Integrations && (ai = Ge.Sentry.Integrations);
  const fi = { ...ai, ...Xe, ...ui };
  return fi.Replay = fn, fi.BrowserTracing = hn, t.Breadcrumbs = Rr, t.BrowserClient = ar, t.BrowserTracing = hn, t.Dedupe = Nr, t.Feedback = an, t.FunctionToString = Le, t.GlobalHandlers = qr, t.HttpContext = Jr, t.Hub = Gn, t.InboundFilters = De, t.Integrations = fi, t.LinkedErrors = Yr, t.Replay = fn, t.SDK_VERSION = Wn, t.SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op", t.SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin", t.SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate", t.SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source", t.Scope = Hn, t.TryCatch = ni, t.WINDOW = Ge, t.addBreadcrumb = Tn, t.addEventProcessor = function(t2) {
    const n2 = On();
    n2 && n2.addEventProcessor && n2.addEventProcessor(t2);
  }, t.addGlobalEventProcessor = pn, t.addIntegration = function(t2) {
    const n2 = On();
    n2 && n2.addIntegration && n2.addIntegration(t2);
  }, t.addTracingExtensions = function() {
  }, t.breadcrumbsIntegration = Mr, t.browserApiErrorsIntegration = ti, t.browserTracingIntegration = function(t2) {
    return new hn({});
  }, t.captureEvent = kn, t.captureException = captureException, t.captureMessage = function(t2, n2) {
    const e2 = "string" == typeof n2 ? n2 : void 0, r2 = "string" != typeof n2 ? { captureContext: n2 } : void 0;
    return Vn().captureMessage(t2, e2, r2);
  }, t.captureUserFeedback = function(t2) {
    const n2 = On();
    n2 && n2.captureUserFeedback(t2);
  }, t.chromeStackLineParser = gr, t.close = async function(t2) {
    const n2 = On();
    return n2 ? n2.close(t2) : Promise.resolve(false);
  }, t.configureScope = function(t2) {
    Vn().configureScope(t2);
  }, t.continueTrace = ({ sentryTrace: t2, baggage: n2 }, e2) => {
    const r2 = In(), { traceparentData: i2, dynamicSamplingContext: o2, propagationContext: s2 } = Vt(t2, n2);
    r2.setPropagationContext(s2);
    const c2 = { ...i2, metadata: z({ dynamicSamplingContext: o2 }) };
    return e2 ? Zn(() => e2(c2)) : c2;
  }, t.createTransport = xe, t.createUserFeedbackEnvelope = ur, t.dedupeIntegration = Ar, t.defaultIntegrations = si, t.defaultStackLineParsers = Tr, t.defaultStackParser = jr, t.eventFromException = rr, t.eventFromMessage = ir, t.exceptionFromError = Ze, t.feedbackIntegration = function(t2) {
    return new an({});
  }, t.flush = async function(t2) {
    const n2 = On();
    return n2 ? n2.flush(t2) : Promise.resolve(false);
  }, t.forceLoad = function() {
  }, t.functionToStringIntegration = Ne, t.geckoStackLineParser = br, t.getActiveSpan = re, t.getClient = On, t.getCurrentHub = Vn, t.getCurrentScope = In, t.getDefaultIntegrations = ci, t.getHubFromCarrier = Qn, t.globalHandlersIntegration = Hr, t.httpContextIntegration = Gr, t.inboundFiltersIntegration = Ie, t.init = function(t2 = {}) {
    void 0 === t2.defaultIntegrations && (t2.defaultIntegrations = ci()), void 0 === t2.release && ("string" == typeof __SENTRY_RELEASE__ && (t2.release = __SENTRY_RELEASE__), Ge.SENTRY_RELEASE && Ge.SENTRY_RELEASE.id && (t2.release = Ge.SENTRY_RELEASE.id)), void 0 === t2.autoSessionTracking && (t2.autoSessionTracking = true), void 0 === t2.sendClientReports && (t2.sendClientReports = true);
    const n2 = { ...t2, stackParser: (e2 = t2.stackParser || jr, Array.isArray(e2) ? K(...e2) : e2), integrations: pe(t2), transport: t2.transport || (vt() ? hr : lr) };
    var e2;
    !function(t3, n3) {
      true === n3.debug && D(() => {
        console.warn("[Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.");
      }), In().update(n3.initialScope);
      const e3 = new t3(n3);
      Se(e3), function(t4) {
        t4.init ? t4.init() : t4.setupIntegrations && t4.setupIntegrations();
      }(e3);
    }(ar, n2), t2.autoSessionTracking && function() {
      if (void 0 === Ge.document) return;
      Dn({ ignoreDuration: true }), Cn(), It(({ from: t3, to: n3 }) => {
        void 0 !== t3 && t3 !== n3 && (Dn({ ignoreDuration: true }), Cn());
      });
    }();
  }, t.isInitialized = function() {
    return !!On();
  }, t.lastEventId = function() {
    return Vn().lastEventId();
  }, t.linkedErrorsIntegration = Vr, t.makeFetchTransport = hr, t.makeMain = Kn, t.makeXHRTransport = lr, t.metrics = ze, t.onLoad = function(t2) {
    t2();
  }, t.opera10StackLineParser = Sr, t.opera11StackLineParser = kr, t.parameterize = function(t2, ...n2) {
    const e2 = new String(String.raw(t2, ...n2));
    return e2.__sentry_template_string__ = t2.join("\0").replace(/%/g, "%%").replace(/\0/g, "%s"), e2.__sentry_template_values__ = n2, e2;
  }, t.replayIntegration = function(t2) {
    return new fn({});
  }, t.setContext = function(t2, n2) {
    Vn().setContext(t2, n2);
  }, t.setCurrentClient = Se, t.setExtra = function(t2, n2) {
    Vn().setExtra(t2, n2);
  }, t.setExtras = function(t2) {
    Vn().setExtras(t2);
  }, t.setTag = function(t2, n2) {
    Vn().setTag(t2, n2);
  }, t.setTags = function(t2) {
    Vn().setTags(t2);
  }, t.setUser = function(t2) {
    Vn().setUser(t2);
  }, t.showReportDialog = (t2 = {}, n2 = Vn()) => {
    if (!Ge.document) return;
    const { client: e2, scope: r2 } = n2.getStackTop(), i2 = t2.dsn || e2 && e2.getDsn();
    if (!i2) return;
    r2 && (t2.user = { ...r2.getUser(), ...t2.user }), t2.eventId || (t2.eventId = n2.lastEventId());
    const o2 = Ge.document.createElement("script");
    o2.async = true, o2.crossOrigin = "anonymous", o2.src = function(t3, n3) {
      const e3 = N(t3);
      if (!e3) return "";
      const r3 = `${fe(e3)}embed/error-page/`;
      let i3 = `dsn=${C(e3)}`;
      for (const t4 in n3) if ("dsn" !== t4 && "onClose" !== t4) if ("user" === t4) {
        const t5 = n3.user;
        if (!t5) continue;
        t5.name && (i3 += `&name=${encodeURIComponent(t5.name)}`), t5.email && (i3 += `&email=${encodeURIComponent(t5.email)}`);
      } else i3 += `&${encodeURIComponent(t4)}=${encodeURIComponent(n3[t4])}`;
      return `${r3}?${i3}`;
    }(i2, t2), t2.onLoad && (o2.onload = t2.onLoad);
    const { onClose: s2 } = t2;
    if (s2) {
      const t3 = (n3) => {
        if ("__sentry_reportdialog_closed__" === n3.data) try {
          s2();
        } finally {
          Ge.removeEventListener("message", t3);
        }
      };
      Ge.addEventListener("message", t3);
    }
    const c2 = Ge.document.head || Ge.document.body;
    c2 && c2.appendChild(o2);
  }, t.startInactiveSpan = function(t2) {
    if (!ee()) return;
    const n2 = oe(t2), e2 = Vn(), r2 = t2.scope ? t2.scope.getSpan() : re();
    if (t2.onlyIfParent && !r2) return;
    const i2 = Yn(), o2 = In();
    let s2;
    if (r2) s2 = r2.startChild(n2);
    else {
      const { traceId: t3, dsc: r3, parentSpanId: c2, sampled: u2 } = { ...i2.getPropagationContext(), ...o2.getPropagationContext() };
      s2 = e2.startTransaction({ traceId: t3, parentSpanId: c2, parentSampled: u2, ...n2, metadata: { dynamicSamplingContext: r3, ...n2.metadata } });
    }
    return se(s2, o2, i2), s2;
  }, t.startSpan = function(t2, n2) {
    const e2 = oe(t2);
    return Zn(() => jn(t2.scope, (r2) => {
      const i2 = Vn(), o2 = r2.getSpan(), s2 = t2.onlyIfParent && !o2 ? void 0 : ie(i2, o2, e2);
      return r2.setSpan(s2), ne(() => n2(s2), () => {
        if (s2) {
          const { status: t3 } = En(s2);
          t3 && "ok" !== t3 || s2.setStatus("internal_error");
        }
      }, () => s2 && s2.end());
    }));
  }, t.startSpanManual = function(t2, n2) {
    const e2 = oe(t2);
    return Zn(() => jn(t2.scope, (r2) => {
      const i2 = Vn(), o2 = r2.getSpan(), s2 = t2.onlyIfParent && !o2 ? void 0 : ie(i2, o2, e2);
      function c2() {
        s2 && s2.end();
      }
      return r2.setSpan(s2), ne(() => n2(s2, c2), () => {
        if (s2 && s2.isRecording()) {
          const { status: t3 } = En(s2);
          t3 && "ok" !== t3 || s2.setStatus("internal_error");
        }
      });
    }));
  }, t.startTransaction = function(t2, n2) {
    return Vn().startTransaction({ ...t2 }, n2);
  }, t.winjsStackLineParser = wr, t.withIsolationScope = function(t2) {
    return Zn(() => t2(Yn()));
  }, t.withScope = jn, t.wrap = function(t2) {
    return Ye(t2)();
  }, t;
})({});
document.addEventListener("config-ready", function() {
  if (CONFIG.sentry && CONFIG.sentry.dsn && CONFIG.sentry.dsn !== "YOUR_SENTRY_DSN") {
    Sentry.init(CONFIG.sentry);
  }
});
document.addEventListener("DOMContentLoaded", function() {
  if (typeof CONFIG === "undefined") {
    console.error("CONFIG is not defined. Firebase initialization skipped.");
    return;
  }
  const script = document.createElement("script");
  script.src = "js/firebase-init.js";
  document.body.appendChild(script);
});
const ErrorLogViewer = {
  // Initialize the viewer
  init() {
    this.createViewerUI();
    this.setupEventListeners();
    this.updateErrorList();
  },
  // Create the viewer UI
  createViewerUI() {
    const viewer = document.createElement("div");
    viewer.id = "error-log-viewer";
    viewer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 800px;
            max-height: 800px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            display: none;
            font-family: Arial, sans-serif;
        `;
    viewer.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 16px;">Error Log</h3>
                <div>
                    <button id="error-log-clear" style="margin-right: 5px; padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear</button>
                    <button id="error-log-close" style="padding: 4px 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #eee; background: #f5f5f5;">
                <div style="margin-bottom: 10px;">
                    <input type="text" id="error-log-search" placeholder="Search errors..." style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="error" checked> JavaScript
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="promise" checked> Promise
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="performance" checked> Performance
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="form_submission" checked> Form
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="form_validation" checked> Validation
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" class="error-type-filter" value="image_load" checked> Image
                    </label>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <select id="error-time-filter" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="all">All Time</option>
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                    <select id="error-group-filter" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="none">No Grouping</option>
                        <option value="type">Group by Type</option>
                        <option value="message">Group by Message</option>
                        <option value="url">Group by URL</option>
                    </select>
                    <select id="error-sort-filter" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="type">Type</option>
                        <option value="count">Count</option>
                    </select>
                    <select id="error-chart-type" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="none">No Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                    </select>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="error-stack-filter" checked> Include Stack Traces
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="error-details-filter" checked> Show Details
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="error-performance-filter" checked> Include Performance
                    </label>
                </div>
            </div>
            <div id="error-log-stats" style="padding: 10px; border-bottom: 1px solid #eee; background: #e3f2fd; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;">
                    <div>Total Errors: <span id="error-total">0</span></div>
                    <div>Filtered: <span id="error-filtered">0</span></div>
                    <div>Groups: <span id="error-groups">0</span></div>
                </div>
                <div id="error-type-stats" style="margin-top: 5px; display: flex; gap: 10px; flex-wrap: wrap;"></div>
            </div>
            <div id="error-log-chart" style="padding: 10px; border-bottom: 1px solid #eee; display: none;">
                <canvas id="error-chart-canvas" width="780" height="200"></canvas>
            </div>
            <div id="error-log-content" style="padding: 10px; overflow-y: auto; max-height: 400px;">
                <div id="error-log-list"></div>
            </div>
        `;
    document.body.appendChild(viewer);
  },
  // Set up event listeners
  setupEventListeners() {
    document.getElementById("error-log-close").addEventListener("click", () => {
      document.getElementById("error-log-viewer").style.display = "none";
    });
    document.getElementById("error-log-clear").addEventListener("click", () => {
      ErrorReporter.clearErrors();
      this.updateErrorList();
    });
    document.getElementById("error-log-search").addEventListener("input", (e) => {
      this.updateErrorList();
    });
    document.querySelectorAll(".error-type-filter").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.updateErrorList();
      });
    });
    document.getElementById("error-time-filter").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.getElementById("error-group-filter").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.getElementById("error-sort-filter").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.getElementById("error-chart-type").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.getElementById("error-stack-filter").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.getElementById("error-details-filter").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.getElementById("error-performance-filter").addEventListener("change", () => {
      this.updateErrorList();
    });
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        const viewer = document.getElementById("error-log-viewer");
        viewer.style.display = viewer.style.display === "none" ? "block" : "none";
      }
    });
  },
  // Update the error list
  updateErrorList() {
    const errors = ErrorReporter.getErrors();
    const errorList = document.getElementById("error-log-list");
    errorList.innerHTML = "";
    if (errors.length === 0) {
      errorList.innerHTML = '<p style="text-align: center; color: #666;">No errors logged</p>';
      this.updateStats(errors, []);
      this.updateChart(errors, []);
      return;
    }
    const searchTerm = document.getElementById("error-log-search").value.toLowerCase();
    const selectedTypes = Array.from(document.querySelectorAll(".error-type-filter:checked")).map((cb) => cb.value);
    const timeFilter = document.getElementById("error-time-filter").value;
    const groupFilter = document.getElementById("error-group-filter").value;
    const sortFilter = document.getElementById("error-sort-filter").value;
    const chartType = document.getElementById("error-chart-type").value;
    const includeStack = document.getElementById("error-stack-filter").checked;
    const showDetails = document.getElementById("error-details-filter").checked;
    const includePerformance = document.getElementById("error-performance-filter").checked;
    let filteredErrors = errors.filter((error) => {
      const matchesSearch = JSON.stringify(error).toLowerCase().includes(searchTerm);
      const matchesType = selectedTypes.includes(error.type);
      return matchesSearch && matchesType;
    });
    filteredErrors = this.applyTimeFilter(filteredErrors, timeFilter);
    let groupedErrors = groupFilter === "none" ? filteredErrors : this.groupErrors(filteredErrors, groupFilter);
    groupedErrors = this.sortErrors(groupedErrors, sortFilter);
    if (Array.isArray(groupedErrors)) {
      this.displayErrors(groupedErrors, errorList, includeStack, showDetails, includePerformance);
    } else {
      this.displayGroupedErrors(groupedErrors, errorList, includeStack, showDetails, includePerformance);
    }
    this.updateStats(errors, filteredErrors);
    this.updateChart(errors, filteredErrors, chartType);
  },
  // Update the chart
  updateChart(allErrors, filteredErrors, chartType) {
    const chartContainer = document.getElementById("error-log-chart");
    const canvas2 = document.getElementById("error-chart-canvas");
    const ctx = canvas2.getContext("2d");
    ctx.clearRect(0, 0, canvas2.width, canvas2.height);
    if (chartType === "none") {
      chartContainer.style.display = "none";
      return;
    }
    chartContainer.style.display = "block";
    const typeCounts = {};
    filteredErrors.forEach((error) => {
      typeCounts[error.type] = (typeCounts[error.type] || 0) + 1;
    });
    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    const colors = labels.map((type) => this.getErrorColor(type));
    switch (chartType) {
      case "pie":
        this.drawPieChart(ctx, labels, data, colors);
        break;
      case "bar":
        this.drawBarChart(ctx, labels, data, colors);
        break;
      case "line":
        this.drawLineChart(ctx, labels, data, colors);
        break;
    }
  },
  // Draw pie chart
  drawPieChart(ctx, labels, data, colors) {
    const total = data.reduce((a, b) => a + b, 0);
    let startAngle = 0;
    data.forEach((value, index) => {
      const sliceAngle = value / total * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.arc(canvas.width / 2, canvas.height / 2, 100, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();
      startAngle += sliceAngle;
    });
  },
  // Draw bar chart
  drawBarChart(ctx, labels, data, colors) {
    const barWidth = 40;
    const spacing = 20;
    const startX = 50;
    const startY = canvas.height - 50;
    data.forEach((value, index) => {
      const x = startX + (barWidth + spacing) * index;
      const height = value / Math.max(...data) * (canvas.height - 100);
      ctx.fillStyle = colors[index];
      ctx.fillRect(x, startY - height, barWidth, height);
      ctx.fillStyle = "#000";
      ctx.fillText(labels[index], x, startY + 20);
    });
  },
  // Draw line chart
  drawLineChart(ctx, labels, data, colors) {
    const startX = 50;
    const startY = canvas.height - 50;
    const width = canvas.width - 100;
    const height = canvas.height - 100;
    ctx.beginPath();
    ctx.moveTo(startX, startY - data[0] / Math.max(...data) * height);
    data.forEach((value, index) => {
      const x = startX + width / (data.length - 1) * index;
      const y = startY - value / Math.max(...data) * height;
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#2196F3";
    ctx.stroke();
    data.forEach((value, index) => {
      const x = startX + width / (data.length - 1) * index;
      const y = startY - value / Math.max(...data) * height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = colors[index];
      ctx.fill();
    });
  },
  // Apply time filter
  applyTimeFilter(errors, timeFilter) {
    if (timeFilter === "all") return errors;
    const now = /* @__PURE__ */ new Date();
    const timeRanges = {
      "1h": 60 * 60 * 1e3,
      "24h": 24 * 60 * 60 * 1e3,
      "7d": 7 * 24 * 60 * 60 * 1e3
    };
    return errors.filter((error) => {
      const errorTime = new Date(error.timestamp);
      return now - errorTime <= timeRanges[timeFilter];
    });
  },
  // Group errors
  groupErrors(errors, groupFilter) {
    const groups = {};
    errors.forEach((error) => {
      let key;
      switch (groupFilter) {
        case "type":
          key = error.type;
          break;
        case "message":
          key = error.message;
          break;
        case "url":
          key = error.url;
          break;
        default:
          key = "ungrouped";
      }
      if (!groups[key]) {
        groups[key] = {
          key,
          count: 0,
          errors: []
        };
      }
      groups[key].count++;
      groups[key].errors.push(error);
    });
    return groups;
  },
  // Sort errors
  sortErrors(errors, sortFilter) {
    if (Array.isArray(errors)) {
      return errors.sort((a, b) => {
        switch (sortFilter) {
          case "newest":
            return new Date(b.timestamp) - new Date(a.timestamp);
          case "oldest":
            return new Date(a.timestamp) - new Date(b.timestamp);
          case "type":
            return a.type.localeCompare(b.type);
          default:
            return 0;
        }
      });
    } else {
      return Object.values(errors).sort((a, b) => {
        switch (sortFilter) {
          case "count":
            return b.count - a.count;
          case "type":
            return a.key.localeCompare(b.key);
          default:
            return 0;
        }
      });
    }
  },
  // Display errors
  displayErrors(errors, container, includeStack, showDetails, includePerformance) {
    errors.forEach((error) => {
      container.appendChild(this.createErrorElement(error, includeStack, showDetails, includePerformance));
    });
  },
  // Display grouped errors
  displayGroupedErrors(groups, container, includeStack, showDetails, includePerformance) {
    groups.forEach((group) => {
      const groupElement = document.createElement("div");
      groupElement.style.cssText = `
                margin-bottom: 20px;
                border: 1px solid #eee;
                border-radius: 4px;
            `;
      const header = document.createElement("div");
      header.style.cssText = `
                padding: 10px;
                background: #f5f5f5;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
      header.innerHTML = `
                <div>
                    <strong>${group.key}</strong>
                    <span style="margin-left: 10px; color: #666;">(${group.count} errors)</span>
                </div>
                <button class="toggle-group" style="padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Show</button>
            `;
      const content = document.createElement("div");
      content.style.display = "none";
      group.errors.forEach((error) => {
        content.appendChild(this.createErrorElement(error, includeStack, showDetails, includePerformance));
      });
      groupElement.appendChild(header);
      groupElement.appendChild(content);
      container.appendChild(groupElement);
      header.querySelector(".toggle-group").addEventListener("click", () => {
        const isVisible = content.style.display === "block";
        content.style.display = isVisible ? "none" : "block";
        header.querySelector(".toggle-group").textContent = isVisible ? "Show" : "Hide";
      });
    });
  },
  // Create error element
  createErrorElement(error, includeStack, showDetails, includePerformance) {
    const element = document.createElement("div");
    element.style.cssText = `
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #eee;
            border-radius: 4px;
            background: #fff;
        `;
    const details = this.getErrorDetails(error, includePerformance);
    element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <strong style="color: ${this.getErrorColor(error.type)};">${error.type}</strong>
                    <span style="margin-left: 10px; color: #666;">${new Date(error.timestamp).toLocaleString()}</span>
                </div>
                <button class="toggle-details" style="padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Show Details</button>
            </div>
            <div style="margin-top: 5px;">${error.message}</div>
            <div class="error-details" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                ${details}
            </div>
        `;
    element.querySelector(".toggle-details").addEventListener("click", () => {
      const detailsElement = element.querySelector(".error-details");
      const isVisible = detailsElement.style.display === "block";
      detailsElement.style.display = isVisible ? "none" : "block";
      element.querySelector(".toggle-details").textContent = isVisible ? "Show Details" : "Hide Details";
    });
    return element;
  },
  // Update stats
  updateStats(allErrors, filteredErrors) {
    document.getElementById("error-total").textContent = allErrors.length;
    document.getElementById("error-filtered").textContent = filteredErrors.length;
    const typeStats = document.getElementById("error-type-stats");
    typeStats.innerHTML = "";
    const typeCounts = {};
    filteredErrors.forEach((error) => {
      typeCounts[error.type] = (typeCounts[error.type] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
      const stat = document.createElement("div");
      stat.style.cssText = `
                padding: 4px 8px;
                background: ${this.getErrorColor(type)};
                color: white;
                border-radius: 4px;
                font-size: 12px;
            `;
      stat.textContent = `${type}: ${count}`;
      typeStats.appendChild(stat);
    });
  },
  // Get error color
  getErrorColor(type) {
    const colors = {
      error: "#f44336",
      promise: "#ff9800",
      performance: "#2196F3",
      form_submission: "#4CAF50",
      form_validation: "#9C27B0",
      image_load: "#795548"
    };
    return colors[type] || "#666";
  },
  // Get error details
  getErrorDetails(error, includePerformance) {
    let details = "";
    if (error.stack) {
      details += `
                <div style="margin-bottom: 10px;">
                    <strong>Stack Trace:</strong>
                    <pre style="margin: 5px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; overflow-x: auto;">${error.stack}</pre>
                </div>
            `;
    }
    if (includePerformance && error.type === "performance") {
      details += `
                <div style="margin-bottom: 10px;">
                    <strong>Performance Metrics:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Load Time: ${error.loadTime}ms</li>
                        <li>DOM Ready: ${error.domReady}ms</li>
                        <li>First Paint: ${error.firstPaint}ms</li>
                    </ul>
                </div>
            `;
    }
    details += `
            <div style="margin-bottom: 10px;">
                <strong>Metadata:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>URL: ${error.url}</li>
                    <li>User Agent: ${error.userAgent}</li>
                    <li>Location: ${error.location}</li>
                    <li>City: ${error.city}</li>
                    <li>State: ${error.state}</li>
                </ul>
            </div>
        `;
    return details;
  },
  // Show the viewer
  show() {
    document.getElementById("error-log-viewer").style.display = "block";
    this.updateErrorList();
  },
  // Hide the viewer
  hide() {
    document.getElementById("error-log-viewer").style.display = "none";
  }
};
ErrorLogViewer.init();
document.getElementById("footer-year").textContent = (/* @__PURE__ */ new Date()).getFullYear();
var hamburger = document.querySelector(".hamburger");
var mobileNav = document.getElementById("mobile-nav");
if (hamburger && mobileNav) {
  let updateHamburgerDisplay = function() {
    if (window.innerWidth <= 900) {
      hamburger.style.display = "block";
    } else {
      hamburger.style.display = "none";
      mobileNav.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  };
  updateHamburgerDisplay();
  window.addEventListener("resize", updateHamburgerDisplay);
  hamburger.addEventListener("click", function() {
    var expanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", !expanded);
    mobileNav.classList.toggle("open", !expanded);
  });
} else {
  console.log("Hamburger or mobile nav not found");
}
//# sourceMappingURL=main.js.map
