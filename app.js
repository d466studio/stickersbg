// =====================
// CONFIG (EDIT THESE)
// =====================
const CONFIG = {
  brandName: "BG STICKERS",
  instagram: "@thebgstickers",

  // Put your form endpoint here (Formspree / Getform etc.)
  // Example: "https://formspree.io/f/xxxxxxx"
  formEndpoint: "",

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
    "galeria": "ГАЛЕРИЯ",
    "nadpisi": "НАДПИСИ",
    "stikeri": "СТИКЕРИ",
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
  if (!selectEl) return;
  selectEl.innerHTML = "";
  colors.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.hex;
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  });
  const yellow = colors.find(c => c.name.toLowerCase().includes("жъл"));
  if (yellow) selectEl.value = yellow.hex;
}

// Multi-color checkbox renderer
function renderColorMulti(containerEl, hiddenEl, colors, defaults = 1) {
  containerEl.innerHTML = "";

  // pick default first N colors, prefer Yellow as first if exists
  const yellowIdx = colors.findIndex(c => c.name.toLowerCase().includes("жъл"));
  const defaultSet = new Set();
  if (yellowIdx >= 0) defaultSet.add(colors[yellowIdx].hex);
  for (const c of colors) {
    if (defaultSet.size >= defaults) break;
    defaultSet.add(c.hex);
  }

  colors.forEach(c => {
    const id = `c_${Math.random().toString(16).slice(2)}`;
    const label = document.createElement("label");
    label.className = "colorChk";
    label.setAttribute("for", id);

    const dot = document.createElement("span");
    dot.className = "colorDot";
    dot.style.background = c.hex;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.value = c.hex;
    checkbox.checked = defaultSet.has(c.hex);

    const txt = document.createElement("span");
    txt.textContent = c.name;

    label.appendChild(checkbox);
    label.appendChild(dot);
    label.appendChild(txt);

    containerEl.appendChild(label);
  });

  const updateHidden = () => {
    const chosen = [...containerEl.querySelectorAll("input[type=checkbox]:checked")]
      .map(x => x.value);

    // Ensure at least 1 selected
    if (chosen.length === 0) {
      const first = containerEl.querySelector("input[type=checkbox]");
      first.checked = true;
    }

    const chosen2 = [...containerEl.querySelectorAll("input[type=checkbox]:checked")]
      .map(x => x.value);

    hiddenEl.value = chosen2.join(",");

    // return chosen as array
    return chosen2;
  };

  containerEl.addEventListener("change", updateHidden);
  return updateHidden();
}

function getSelectedColorsFromHidden(hiddenEl) {
  const v = (hiddenEl.value || "").trim();
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

// ---------------------
// Pricing
// ---------------------
function basePriceByWidth(widthCm) {
  const w = Number(widthCm || 0);
  if (w <= 10) return 10;
  if (w > 10 && w <= 50) return 15;
  if (w > 50 && w <= 100) return 17;
  if (w > 100 && w <= 150) return 20;
  if (w > 150 && w <= 200) return 20;
  return 20;
}

// extraColors = selected - 1
function estimatePrice({ widthCm, selectedColorsCount, extraBase = 0 }) {
  const base = basePriceByWidth(widthCm) + extraBase;
  const extraColors = Math.max(0, (selectedColorsCount || 1) - 1);
  const extra = extraColors * 3;
  return {
    base,
    extraColors,
    extra,
    total: base + extra
  };
}

// ---------------------
// Popular items (demo)
// ---------------------
const POPULAR_TEXTS = [
  { title: "LOW & SLOW", meta: "Текст • чист стил", pills: ["едноцветно", "бързо"] },
  { title: "NO RISK NO FUN", meta: "Текст • спорт", pills: ["едноцветно"] },
  { title: "STANCE", meta: "Късо • агресивно", pills: ["компактно"] },
  { title: "TURBO", meta: "Текст • минимал", pills: ["едноцветно"] },
  { title: "DRIVEN", meta: "Текст • clean", pills: ["популярно"] },
  { title: "TRACK DAY", meta: "Текст • писта", pills: ["едноцветно"] }
];

const AUTO_BY_BRAND = {
  "BMW": [
    { title: "Windshield Banner (BMW)", meta: "Предно стъкло", pills: ["банер", "чист текст"] },
    { title: "Side stripes (M-style)", meta: "Странично", pills: ["спорт"] },
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
// Live preview + pricing (НАДПИСИ)
// ---------------------
function updateNadpisiPreviewAndPrice() {
  const text = document.getElementById("npText").value || "YOUR TEXT";
  const width = Number(document.getElementById("npWidth").value || 40);
  const font = document.getElementById("npFont").value;

  const hidden = document.getElementById("npColorsHidden");
  const colors = getSelectedColorsFromHidden(hidden);
  const mainColor = colors[0] || "#ffd400";

  const previewText = document.getElementById("npPreviewText");
  previewText.textContent = text;
  previewText.style.fontFamily = `${font}, Roboto, sans-serif`;
  previewText.style.color = mainColor;

  const size = Math.max(18, Math.min(72, width * 1.0));
  previewText.style.fontSize = `${size}px`;

  document.getElementById("npRulerText").textContent = `~${width} см`;

  const est = estimatePrice({ widthCm: width, selectedColorsCount: Math.max(1, colors.length), extraBase: 0 });
  document.getElementById("npPrice").textContent = `${est.total}€  (база ${est.base}€ + ${est.extra}€ за ${est.extraColors} доп. цвят/цвята)`;
}

function initNadpisiHandlers() {
  ["npText","npWidth","npFont"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateNadpisiPreviewAndPrice);
    if (el) el.addEventListener("change", updateNadpisiPreviewAndPrice);
  });

  const multi = document.getElementById("npColorMulti");
  if (multi) multi.addEventListener("change", updateNadpisiPreviewAndPrice);
}

// ---------------------
// Live preview + pricing (СТИКЕРИ)
// ---------------------
function updateStikeriPreviewAndPrice() {
  const text = document.getElementById("stText").value || "BG STICKERS";
  const width = Number(document.getElementById("stWidth").value || 40);
  const font = document.getElementById("stFont").value;

  const hidden = document.getElementById("stColorsHidden");
  const colors = getSelectedColorsFromHidden(hidden);
  const mainColor = colors[0] || "#ffd400";

  const previewText = document.getElementById("stPreviewText");
  previewText.textContent = text;
  previewText.style.fontFamily = `${font}, Roboto, sans-serif`;
  previewText.style.color = mainColor;

  const size = Math.max(18, Math.min(72, width * 1.0));
  previewText.style.fontSize = `${size}px`;

  document.getElementById("stRulerText").textContent = `~${width} см`;

  // +2€ extraBase for design (not simple text)
  const est = estimatePrice({ widthCm: width, selectedColorsCount: Math.max(1, colors.length), extraBase: 2 });
  document.getElementById("stPrice").textContent = `${est.total}€  (база ${est.base}€ + ${est.extra}€ за ${est.extraColors} доп. цвят/цвята)`;
}

function initStikeriHandlers() {
  ["stText","stWidth","stFont"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateStikeriPreviewAndPrice);
    if (el) el.addEventListener("change", updateStikeriPreviewAndPrice);
  });

  const multi = document.getElementById("stColorMulti");
  if (multi) multi.addEventListener("change", updateStikeriPreviewAndPrice);

  // thumbnail preview
  const f = document.getElementById("stFile");
  const img = document.getElementById("stThumb");
  if (f && img) {
    f.addEventListener("change", () => {
      const file = f.files && f.files[0];
      if (!file) {
        img.style.display = "none";
        img.src = "";
        return;
      }
      const url = URL.createObjectURL(file);
      img.src = url;
      img.style.display = "block";
    });
  }
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
    hintEl.textContent =
      `⚠️ Няма зададен formEndpoint. Добави endpoint (Formspree/Getform) в app.js. Междувременно: копирай данните и пиши на ${CONFIG.instagram} или ${CONFIG.contactEmail}.`;
    return;
  }

  hintEl.textContent = "Изпращане...";
  const fd = new FormData(formEl);

  Object.entries(extra || {}).forEach(([k,v]) => fd.append(k, v));

  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      body: fd,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      formEl.reset();
      hintEl.textContent = "✅ Заявката е изпратена! Ще се свържем за потвърждение.";

      // hide thumb if exists
      const stThumb = document.getElementById("stThumb");
      if (stThumb) { stThumb.style.display = "none"; stThumb.src = ""; }

      // refresh estimates
      updateNadpisiPreviewAndPrice();
      updateStikeriPreviewAndPrice();
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

  const fS = document.getElementById("formStikeri");
  if (fS) {
    fS.addEventListener("submit", (e) => {
      e.preventDefault();
      postForm(fS, document.getElementById("stSubmitHint"), { type: "stikeri_custom" });
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

  // Multi color selectors
  const npMulti = document.getElementById("npColorMulti");
  const npHidden = document.getElementById("npColorsHidden");
  if (npMulti && npHidden) {
    renderColorMulti(npMulti, npHidden, colors, 1);
  }

  const stMulti = document.getElementById("stColorMulti");
  const stHidden = document.getElementById("stColorsHidden");
  if (stMulti && stHidden) {
    renderColorMulti(stMulti, stHidden, colors, 1);
  }

  // single color selects
  fillColorSelect(document.getElementById("avtoColor"), colors);

  // Popular grids
  renderCards(document.getElementById("nadpisiPopularGrid"), POPULAR_TEXTS);

  initTabs();
  initBrandDropdown();
  initNadpisiHandlers();
  initStikeriHandlers();
  initForms();

  // Router
  function onRoute() {
    setActivePage(currentRoute());
  }
  window.addEventListener("hashchange", onRoute);
  onRoute();

  // initial estimates
  updateNadpisiPreviewAndPrice();
  updateStikeriPreviewAndPrice();
})();
