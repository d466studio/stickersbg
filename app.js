// =====================
// CONFIG (EDIT THESE)
// =====================
const CONFIG = {
  brandName: "VINYL STUDIO",

  // Put your form endpoint here (Formspree / Getform etc.)
  // Example: "https://formspree.io/f/xxxxxxx"
  formEndpoint: "",

  // Optional: show in messages
  contactEmail: "you@example.com"
};

// ---------------------
// Simple router (hash)
// ---------------------
function setActivePage(route) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.remove("active"));

  const target = document.querySelector(`#page-${route}`) || document.querySelector("#page-nachalo");
  target.classList.add("active");

  document.querySelectorAll(".navLink").forEach(a => {
    a.classList.toggle("active", a.dataset.route === route);
  });

  const titles = {
    "nachalo": "НАЧАЛО",
    "nadpisi": "НАДПИСИ",
    "avto": "АВТО",
    "print": "ПРИНТ СТИКЕР",
    "za-nas": "ЗА НАС"
  };
  document.title = `${titles[route] || "НАЧАЛО"} • ${CONFIG.brandName}`;
}

function currentRoute() {
  const hash = (location.hash || "#nachalo").replace("#", "");
  return hash || "nachalo";
}

// ---------------------
// Colors (global list)
// localStorage override (admin.html)
// ---------------------
async function loadColors() {
  const ls = localStorage.getItem("vinyl_colors_override");
  if (ls) {
    try { return JSON.parse(ls); } catch {}
  }
  const res = await fetch("colors.json", { cache: "no-store" });
  return await res.json();
}

function renderColorDock(colors) {
  const swatches = document.getElementById("swatches");
  swatches.innerHTML = "";
  colors.forEach(c => {
    const el = document.createElement("div");
    el.className = "swatch";
    el.style.background = c.hex;
    el.dataset.tip = `${c.name} • ${c.hex}`;
    swatches.appendChild(el);
  });
}

function fillColorSelect(selectEl, colors) {
  selectEl.innerHTML = "";
  colors.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.hex;
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  });
  // default to yellow if exists
  const yellow = colors.find(c => c.name.toLowerCase().includes("жъл"));
  if (yellow) selectEl.value = yellow.hex;
}

// ---------------------
// Popular items (demo)
// ---------------------
const POPULAR_TEXTS = [
  { title: "LOW & SLOW", meta: "Текст • чист стил", pills: ["едноцветно", "бързо"] },
  { title: "NO RISK NO FUN", meta: "Текст • спорт", pills: ["едноцветно", "лесно лепене"] },
  { title: "STANCE", meta: "Късо • агресивно", pills: ["компактно"] },
  { title: "TURBO", meta: "Текст • минимал", pills: ["едноцветно"] },
  { title: "DRIVEN", meta: "Текст • clean", pills: ["популярно"] },
  { title: "TRACK DAY", meta: "Текст • писта", pills: ["едноцветно"] }
];

const AUTO_BY_BRAND = {
  "BMW": [
    { title: "Windshield Banner (BMW)", meta: "Предно стъкло", pills: ["банер", "чист текст"] },
    { title: "Side stripes (M-style)", meta: "Странично", pills: ["спорт", "двойка"] },
    { title: "Rear text (BMW club)", meta: "Задно", pills: ["минимал"] }
  ],
  "VW": [
    { title: "Windshield Banner (VW)", meta: "Предно стъкло", pills: ["банер"] },
    { title: "Side text (VAG)", meta: "Странично", pills: ["кратък текст"] },
    { title: "Rear small decal", meta: "Задно", pills: ["малък"] }
  ],
  "AUDI": [
    { title: "Windshield Banner (AUDI)", meta: "Предно стъкло", pills: ["банер"] },
    { title: "Side quattro text", meta: "Странично", pills: ["clean"] },
    { title: "Rear minimal text", meta: "Задно", pills: ["минимал"] }
  ],
  "MERCEDES": [
    { title: "Windshield Banner (MB)", meta: "Предно стъкло", pills: ["банер"] },
    { title: "Side AMG text", meta: "Странично", pills: ["спорт"] },
    { title: "Rear small tag", meta: "Задно", pills: ["малък"] }
  ],
  "ДРУГО": [
    { title: "Universal windshield text", meta: "Предно стъкло", pills: ["универсален"] },
    { title: "Universal side text", meta: "Странично", pills: ["универсален"] },
    { title: "Universal rear text", meta: "Задно", pills: ["универсален"] }
  ]
};

function renderCards(gridEl, items) {
  gridEl.innerHTML = "";
  items.forEach(it => {
    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML = `
      <div class="itemTitle">${escapeHtml(it.title)}</div>
      <div class="itemMeta">${escapeHtml(it.meta || "")}</div>
      <div class="itemPillRow">
        ${(it.pills || []).map(p => `<span class="pill">${escapeHtml(p)}</span>`).join("")}
      </div>
    `;
    gridEl.appendChild(card);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

// ---------------------
// Tabs
// ---------------------
function initTabs() {
  document.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".page");
      group.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
      group.querySelectorAll(".tabPanel").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const id = btn.dataset.tab === "nadpisi-pop" ? "#tab-nadpisi-pop" : "#tab-nadpisi-custom";
      group.querySelector(id).classList.add("active");
    });
  });
}

// ---------------------
// Live preview (НАДПИСИ)
// ---------------------
function updateNadpisiPreview() {
  const text = document.getElementById("npText").value || "YOUR TEXT";
  const width = Number(document.getElementById("npWidth").value || 40);

  const font = document.getElementById("npFont").value;
  const color = document.getElementById("npColor").value;

  const previewText = document.getElementById("npPreviewText");
  previewText.textContent = text;
  previewText.style.fontFamily = `${font}, Roboto, sans-serif`;
  previewText.style.color = color;

  // Scale roughly by width (visual only)
  const size = Math.max(18, Math.min(72, width * 1.0));
  previewText.style.fontSize = `${size}px`;

  document.getElementById("npRulerText").textContent = `~${width} см`;
}

function initPreviewHandlers() {
  ["npText","npWidth","npFont","npColor"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateNadpisiPreview);
    if (el) el.addEventListener("change", updateNadpisiPreview);
  });
}

// ---------------------
// Brand dropdown (АВТО)
// ---------------------
function initBrandDropdown() {
  const sel = document.getElementById("brandSelect");
  if (!sel) return;

  Object.keys(AUTO_BY_BRAND).forEach(b => {
    const opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    sel.appendChild(opt);
  });
  sel.value = "BMW";

  const grid = document.getElementById("avtoPopularGrid");
  renderCards(grid, AUTO_BY_BRAND[sel.value]);

  sel.addEventListener("change", () => {
    renderCards(grid, AUTO_BY_BRAND[sel.value] || AUTO_BY_BRAND["ДРУГО"]);
  });
}

// ---------------------
// Forms submit (with optional endpoint)
// ---------------------
async function postForm(formEl, hintEl, extra) {
  if (!CONFIG.formEndpoint) {
    hintEl.textContent = `⚠️ Няма зададен formEndpoint. Добави endpoint (Formspree/Getform) в app.js. Междувременно: направи screenshot/копирай данните и прати на ${CONFIG.contactEmail}.`;
    return;
  }

  hintEl.textContent = "Изпращане...";
  const fd = new FormData(formEl);

  // Add context
  Object.entries(extra || {}).forEach(([k,v]) => fd.append(k, v));

  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      body: fd,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      formEl.reset();
      hintEl.textContent = "✅ Заявката е изпратена! Ще се свържем с теб за потвърждение.";
      // Update preview defaults after reset
      updateNadpisiPreview();
    } else {
      hintEl.textContent = "❌ Грешка при изпращане. Опитай пак или пиши директно в Instagram.";
    }
  } catch (e) {
    hintEl.textContent = "❌ Няма връзка / endpoint проблем. Опитай пак или пиши директно.";
  }
}

function initForms() {
  const f1 = document.getElementById("formNadpisi");
  if (f1) {
    f1.addEventListener("submit", (e) => {
      e.preventDefault();
      postForm(f1, document.getElementById("npSubmitHint"), { type: "nadpisi_custom" });
    });
  }

  const f2 = document.getElementById("formAvtoCustom");
  if (f2) {
    f2.addEventListener("submit", (e) => {
      e.preventDefault();
      postForm(f2, document.getElementById("avtoSubmitHint"), { type: "avto_custom" });
    });
  }

  const f3 = document.getElementById("formPrint");
  if (f3) {
    f3.addEventListener("submit", (e) => {
      e.preventDefault();
      postForm(f3, document.getElementById("printSubmitHint"), { type: "print_sticker" });
    });
  }
}

// ---------------------
// Init
// ---------------------
(async function init(){
  document.getElementById("brandName").textContent = CONFIG.brandName;

  const colors = await loadColors();
  renderColorDock(colors);

  // Fill selects with colors
  fillColorSelect(document.getElementById("npColor"), colors);
  fillColorSelect(document.getElementById("avtoColor"), colors);

  // Popular grids
  renderCards(document.getElementById("nadpisiPopularGrid"), POPULAR_TEXTS);

  initTabs();
  initBrandDropdown();
  initPreviewHandlers();
  initForms();

  // Router
  function onRoute() {
    setActivePage(currentRoute());
  }
  window.addEventListener("hashchange", onRoute);
  onRoute();

  // initial preview
  updateNadpisiPreview();
})();
