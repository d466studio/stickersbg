// Projects page renderer (static hosting friendly).
(function () {
  "use strict";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c];
  }); }

  var container = null;
  function ensureContainer() {
    if (container) return container;
    container = qs("#projectsGrid");
    return container;
  }

  function buildCard(p) {
    var cover = (p.images && p.images[0]) || "";
    var el = document.createElement("article");
    el.className = "projectCard";
    el.innerHTML =
      '<button class="projectCardBtn" type="button" aria-label="View project">' +
        '<div class="projectCover"><img loading="lazy" src="' + esc(cover) + '" alt="' + esc(p.title) + '"></div>' +
        '<div class="projectMeta">' +
          '<h3 class="projectTitle">' + esc(p.title) + '</h3>' +
          '<p class="projectDesc">' + esc(p.description) + '</p>' +
          '<div class="projectCta">View project</div>' +
        '</div>' +
      '</button>';
    el.querySelector("button").addEventListener("click", function () {
      openModal(p);
    });
    return el;
  }

  // ---- Modal / lightbox ----
  var modal = null;
  var modalImg = null;
  var modalTitle = null;
  var modalDesc = null;
  var modalIndex = 0;
  var modalProject = null;

  function ensureModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.className = "projectModal";
    modal.innerHTML =
      '<div class="projectModalBackdrop" data-close="1"></div>' +
      '<div class="projectModalPanel" role="dialog" aria-modal="true">' +
        '<button class="projectModalClose" type="button" data-close="1" aria-label="Close">×</button>' +
        '<div class="projectModalBody">' +
          '<div class="projectModalMedia">' +
            '<button class="projectNav prev" type="button" aria-label="Previous">‹</button>' +
            '<img class="projectModalImg" alt="">' +
            '<button class="projectNav next" type="button" aria-label="Next">›</button>' +
          '</div>' +
          '<div class="projectModalText">' +
            '<h3 class="projectModalTitle"></h3>' +
            '<p class="projectModalDesc"></p>' +
            '<div class="projectThumbs"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modalImg = qs(".projectModalImg", modal);
    modalTitle = qs(".projectModalTitle", modal);
    modalDesc = qs(".projectModalDesc", modal);

    modal.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-close") === "1") closeModal();
    });

    qs(".projectModalClose", modal).addEventListener("click", closeModal);
    qs(".projectNav.prev", modal).addEventListener("click", function () { step(-1); });
    qs(".projectNav.next", modal).addEventListener("click", function () { step(1); });

    document.addEventListener("keydown", function (e) {
      if (!modalProject || !modal.classList.contains("active")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  function renderThumbs(p) {
    var wrap = qs(".projectThumbs", modal);
    wrap.innerHTML = "";
    (p.images || []).forEach(function (src, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "projectThumb";
      b.innerHTML = '<img loading="lazy" src="' + esc(src) + '" alt="">';
      b.addEventListener("click", function () { setIndex(idx); });
      wrap.appendChild(b);
    });
  }

  function setIndex(idx) {
    if (!modalProject) return;
    var imgs = modalProject.images || [];
    if (!imgs.length) return;
    modalIndex = (idx + imgs.length) % imgs.length;
    modalImg.src = imgs[modalIndex];
    modalImg.alt = modalProject.title + " – image " + (modalIndex + 1);
    // active thumb
    var thumbs = qsa(".projectThumb", modal);
    thumbs.forEach(function (t, i) { t.classList.toggle("active", i === modalIndex); });
  }

  function step(dir) {
    setIndex(modalIndex + dir);
  }

  function openModal(p) {
    ensureModal();
    modalProject = p;
    modalTitle.textContent = p.title || "";
    modalDesc.textContent = p.description || "";
    renderThumbs(p);
    setIndex(0);
    modal.classList.add("active");
    document.documentElement.classList.add("modalOpen");
    document.body.classList.add("modalOpen");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("active");
    document.documentElement.classList.remove("modalOpen");
    document.body.classList.remove("modalOpen");
    modalProject = null;
  }

  // ---- Data ----
  function load() {
    var grid = ensureContainer();
    if (!grid) return;

    fetch("projects/projects.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var list = (data && data.projects) || [];
        grid.innerHTML = "";
        if (!list.length) {
          grid.innerHTML = '<div class="emptyState">No projects yet.</div>';
          return;
        }
        list.forEach(function (p) { grid.appendChild(buildCard(p)); });
      })
      .catch(function () {
        grid.innerHTML = '<div class="emptyState">Could not load projects.</div>';
      });
  }

  // Load on DOM ready, and also when navigating to #projects.
  function onHash() {
    if ((location.hash || "").replace("#", "").split("?")[0] === "projects") load();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      load(); // safe to load once (cached)
      window.addEventListener("hashchange", onHash);
    });
  } else {
    load();
    window.addEventListener("hashchange", onHash);
  }
})();
