const CONFIG = {
  brandName: "BG STICKERS",
  instagram: "@thebgstickers",
  formEndpoint: "", // add later
  contactEmail: "you@example.com"
};

// Fallback colors if fetch fails
const FALLBACK_COLORS = [
  { name: "Черно", hex: "#0b0d10" },
  { name: "Бяло", hex: "#f5f7fa" },
  { name: "Жълто", hex: "#ffd400" },
  { name: "Червено", hex: "#ff3b30" },
  { name: "Синьо", hex: "#2f80ed" },
  { name: "Зелено", hex: "#27ae60" }
];

const $ = (id) => document.getElementById(id);

function currentRoute() {
  return (location.hash || "#nachalo").replace("#", "") || "nachalo";
}

function setActivePage(route) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  (document.querySelector(`#page-${route}`) || document.querySelector("#page-nachalo"))?.classList.add("active");

  document.querySelectorAll(".navLink").forEach(a => a.classList.toggle("active", a.dataset.route === route));
}

async function safeFetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function loadColors() {
  const ls = localStorage.getItem("vinyl_colors_override");
  if (ls) {
    try { return JSON.parse(ls); } catch {}
  }
  const json = await safeFetchJson("colors.json");
  return Array.isArray(json) && json.length ? json : FALLBACK_COLORS;
}

function renderColorDock(colors) {
  const swatches = $("swatches");
  if (!swatches) return;
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
  // default yellow if exists
  const y = colors.find(c => c.name.toLowerCase().includes("жъл"));
  if (y) selectEl.value = y.hex;
}

function renderExtraColors(containerEl, hiddenEl, colors) {
  if (!containerEl || !hiddenEl) return;
  containerEl.innerHTML = "";

  colors.forEach(c => {
    const id = `x_${Math.random().toString(16).slice(2)}`;
    const label = document.createElement("label");
    label.className = "colorChk";
    label.setAttribute("for", id);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.value = c.hex;

    const dot = document.createElement("span");
    dot.className = "colorDot";
    dot.style.background = c.hex;

    const txt = document.createElement("span");
    txt.textContent = c.name;

    label.appendChild(checkbox);
    label.appendChild(dot);
    label.appendChild(txt);
    containerEl.appendChild(label);
  });

  const sync = () => {
    const chosen = [...containerEl.querySelectorAll("input[type=checkbox]:checked")].map(x => x.value);
    hiddenEl.value = chosen.join(",");
    return chosen;
  };
  containerEl.addEventListener("change", sync);
  sync();
}

function getExtraColors(hiddenEl) {
  const v = (hiddenEl?.value || "").trim();
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

// Pricing
function basePriceByWidth(widthCm) {
  const w = Number(widthCm || 0);
  if (w <= 10) return 10;
  if (w <= 50) return 15;
  if (w <= 100) return 17;
  if (w <= 150) return 20;
  if (w <= 200) return 20;
  return 20;
}
function estimatePrice({ widthCm, extraColorsCount, extraBase = 0 }) {
  const base = basePriceByWidth(widthCm) + extraBase;
  const extra = Math.max(0, extraColorsCount) * 3;
  return { base, extra, total: base + extra };
}

// Надписи
function updateNadpisi() {
  const text = $("npText")?.value || "YOUR TEXT";
  const width = Number($("npWidth")?.value || 40);
  const font = $("npFont")?.value || "Roboto";
  const mainColor = $("npMainColor")?.value || "#ffd400";
  const extras = getExtraColors($("npExtraColorsHidden"));

  const p = $("npPreviewText");
  if (p) {
    p.textContent = text;
    p.style.fontFamily = `${font}, Roboto, sans-serif`;
    p.style.color = mainColor;
    p.style.fontSize = `${Math.max(18, Math.min(72, width * 1.0))}px`;
  }
  if ($("npRulerText")) $("npRulerText").textContent = `~${width} см`;

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 0 });
  if ($("npPrice")) $("npPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extras.length} доп.)`;
}

// Стикери
function updateStikeri() {
  const text = $("stText")?.value || "BG STICKERS";
  const width = Number($("stWidth")?.value || 40);
  const font = $("stFont")?.value || "Roboto";
  const mainColor = $("stMainColor")?.value || "#ffd400";
  const extras = getExtraColors($("stExtraColorsHidden"));

  const p = $("stPreviewText");
  if (p) {
    p.textContent = text;
    p.style.fontFamily = `${font}, Roboto, sans-serif`;
    p.style.color = mainColor;
    p.style.fontSize = `${Math.max(18, Math.min(72, width * 1.0))}px`;
  }
  if ($("stRulerText")) $("stRulerText").textContent = `~${width} см`;

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 2 });
  if ($("stPrice")) $("stPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extras.length} доп.)`;
}

// Gallery (won’t break if missing)
async function loadGallery() {
  const grid = $("galleryGrid");
  const hint = $("galleryHint");
  const tagSel = $("galleryTag");
  if (!grid || !tagSel) return;

  const data = await safeFetchJson("gallery.json");
  if (!Array.isArray(data)) {
    if (hint) hint.textContent = "⚠️ gallery.json не се зарежда. Ако тестваш с file://, пусни сайта през localhost или GitHub Pages.";
    grid.innerHTML = `<div class="muted small">Няма данни за галерия.</div>`;
    return;
  }

  const allTags = new Set();
  data.forEach(x => (x.tags || []).forEach(t => allTags.add(String(t).toLowerCase())));
  // reset options
  tagSel.innerHTML = `<option value="all">Всички</option>`;
  [...allTags].sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagSel.appendChild(opt);
  });

  const render = () => {
    const selected = tagSel.value;
    const filtered = selected === "all"
      ? data
      : data.filter(x => (x.tags||[]).map(t=>String(t).toLowerCase()).includes(selected));

    grid.innerHTML = "";
    if (!filtered.length) {
      grid.innerHTML = `<div class="muted small">Няма проекти за този таг.</div>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "galleryItem";
      const hasImg = item.image && String(item.image).trim().length > 0;

      card.innerHTML = `
        ${hasImg ? `<img class="galleryImg" src="${item.image}" alt="">` : `<div class="galleryPh"></div>`}
        <div class="galleryCap">${item.title || ""}</div>
        <div class="gallerySub">${item.caption || ""}</div>
      `;
      grid.appendChild(card);
    });
  };

  tagSel.addEventListener("change", render);
  render();
}

function bindInputs() {
  // Надписи
  ["npText","npWidth","npFont","npMainColor"].forEach(id => {
    $(id)?.addEventListener("input", updateNadpisi);
    $(id)?.addEventListener("change", updateNadpisi);
  });
  $("npExtraColors")?.addEventListener("change", updateNadpisi);

  // Стикери
  ["stText","stWidth","stFont","stMainColor"].forEach(id => {
    $(id)?.addEventListener("input", updateStikeri);
    $(id)?.addEventListener("change", updateStikeri);
  });
  $("stExtraColors")?.addEventListener("change", updateStikeri);

  // Thumbnail
  const f = $("stFile");
  const img = $("stThumb");
  if (f && img) {
    f.addEventListener("change", () => {
      const file = f.files && f.files[0];
      if (!file) { img.style.display = "none"; img.src = ""; return; }
      img.src = URL.createObjectURL(file);
      img.style.display = "block";
    });
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const colors = await loadColors();
  renderColorDock(colors);

  fillColorSelect($("npMainColor"), colors);
  fillColorSelect($("stMainColor"), colors);
  fillColorSelect($("avtoColor"), colors);

  renderExtraColors($("npExtraColors"), $("npExtraColorsHidden"), colors);
  renderExtraColors($("stExtraColors"), $("stExtraColorsHidden"), colors);

  bindInputs();

  loadGallery();

  // initial render
  updateNadpisi();
  updateStikeri();

  // router
  const onRoute = () => setActivePage(currentRoute());
  window.addEventListener("hashchange", onRoute);
  onRoute();
});
