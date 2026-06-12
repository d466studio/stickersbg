// Minimal, fail-safe hash router.
// Goals:
// - Never allow a blank screen: exactly one `.page` stays `.active`.
// - Default and fallback route: `#nachalo`.
// - Must keep working even if other JS fails.
(function () {
  "use strict";

  // Start page must always come first.
  var DEFAULT_ROUTE = "nachalo";

  function normalizeHash(hash) {
    var raw = String(hash || "").replace(/^#/, "").trim();
    // Keep it simple: ignore query/extra path fragments.
    raw = raw.split("?")[0].split("/")[0].trim();
    return raw || DEFAULT_ROUTE;
  }

  function getPages() {
    try {
      return Array.prototype.slice.call(document.querySelectorAll(".page"));
    } catch (_) {
      return [];
    }
  }

  function hasRoutePage(route) {
    try {
      return !!document.getElementById("page-" + route);
    } catch (_) {
      return false;
    }
  }

  function setHash(route) {
    var desired = "#" + route;
    if (location.hash === desired) return;
    try {
      // Replace (no history spam); does not fire hashchange.
      history.replaceState(null, "", location.pathname + location.search + desired);
    } catch (_) {
      // Fallback: may add history entry, but keeps router functional.
      location.hash = desired;
    }
  }

  function applyRoute() {
    try {
      var pages = getPages();
      if (!pages.length) return;

      var route = normalizeHash(location.hash);
      var known = hasRoutePage(route);
      if (!known) route = DEFAULT_ROUTE;

      // Enforce default/fallback hash.
      if (!location.hash || location.hash === "#" || !known) setHash(route);

      var target =
        document.getElementById("page-" + route) ||
        document.getElementById("page-" + DEFAULT_ROUTE) ||
        pages[0];

      // Ensure exactly one `.page` is active.
      for (var i = 0; i < pages.length; i++) {
        pages[i].classList.toggle("active", pages[i] === target);
      }

      // Keep nav highlight in sync (best-effort).
      var links = document.querySelectorAll(".navLink");
      for (var j = 0; j < links.length; j++) {
        var lr = links[j].getAttribute("data-route") || "";
        links[j].classList.toggle("active", lr === route);
      }
    } catch (_) {
      // Intentionally swallow: router must not crash the page.
    }
  }

  // Run immediately (script is loaded at end of <body>).
  applyRoute();
  // And keep it reactive.
  window.addEventListener("hashchange", applyRoute);
  // Safety: if DOM isn't ready for some reason, run once on ready too.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyRoute, { once: true });
  }
})();
