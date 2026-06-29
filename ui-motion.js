// ui-motion.js — lightweight scroll-reveal + entrance motion.
// Design goals:
//  - Zero dependencies, tiny, GitHub-Pages friendly.
//  - Content is fully visible without JS (the .reveal class is only added here),
//    and motion is fully disabled when the user prefers reduced motion.
//  - Route-aware: pages are display:none → block, so we re-scan on hashchange,
//    and a tightly-scoped MutationObserver catches async-rendered cards
//    (projects, popular items, gallery) without touching the live designer canvas.
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || !("IntersectionObserver" in window)) return; // leave content visible

  // Elements worth revealing. Kept intentionally high-level (sections / cards),
  // never tiny inline bits, so the page feels calm rather than busy.
  var SELECTOR = [
    ".pageHead",
    ".pageHeader",
    ".hero > *",
    ".noticeBox",
    ".card",
    ".itemCard",
    ".projectCard",
    ".galleryItem",
    ".tabs"
  ].join(",");

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        io.unobserve(el);
        // Once revealed, drop the transform so it can never interfere with
        // descendant layout (e.g. the designer canvas).
        el.addEventListener("transitionend", function clear(ev) {
          if (ev.propertyName !== "transform") return;
          el.style.transform = "none";
          el.style.willChange = "";
          el.style.transitionDelay = "";
          el.removeEventListener("transitionend", clear);
        });
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  // Tag + observe any not-yet-tagged candidates. Stagger is per-pass so each page
  // gets a pleasant cascade the first time it appears.
  function tag(root) {
    var nodes = (root || document).querySelectorAll(SELECTOR);
    var i = 0;
    Array.prototype.forEach.call(nodes, function (el) {
      if (!el || el.nodeType !== 1 || el.dataset.reveal === "1") return;
      el.dataset.reveal = "1";
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i * 60, 360) + "ms";
      i++;
      io.observe(el);
    });
  }

  function boot() {
    tag(document);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Re-scan after navigation (the newly-active page becomes measurable).
  window.addEventListener("hashchange", function () {
    setTimeout(function () { tag(document); }, 30);
  });

  // Catch async-rendered cards in known containers only (avoids reacting to the
  // designer preview, which rebuilds its DOM constantly while dragging).
  var asyncContainers = ["projectsGrid", "nadpisiPopularGrid", "avtoPopularGrid", "galleryGrid"];
  var pending = false;
  var mo = new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      tag(document);
    });
  });
  asyncContainers.forEach(function (id) {
    var node = document.getElementById(id);
    if (node) mo.observe(node, { childList: true });
  });
})();
