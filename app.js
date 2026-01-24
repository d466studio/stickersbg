const CONFIG = {
  brandName: "BG STICKERS",
  instagram: "@thebgstickers",
  formEndpoint: "", // <-- add Formspree/Getform endpoint here
  contactEmail: "you@example.com"
};

// ---------------- Router ----------------
function setActivePage(route) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  (document.querySelector(`#page-${route}`) || document.querySelector("#page-nachalo")).classList.add("active");

  document.querySelectorAll(".navLink").forEach(a => a.classList.toggle("active", a.dataset.route === route));

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
function currentRoute() { return (location.hash || "#nachalo").replace("#", "") || "nachalo"; }

// ---------------- Colors ----------------
async function loadColors() {
  const ls = localStorage.getItem("vinyl_colors_override");
  if (ls) { try { return JSON.parse(ls); } catch {} }
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
function renderExtraColors(containerEl, hiddenEl, colors) {
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
  const v = (hiddenEl.value || "").trim();
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

// ---------------- Pricing ----------------
function basePriceByWidth(widthCm) {
  const w = Number(widthCm || 0);
  if (w <= 10) return 10;
  if (w > 10 && w <= 50) return 15;
  if (w > 50 && w <= 100) return 17;
  if (w > 100 && w <= 150) return 20;
  if (w > 150 && w <= 200) return 20;
  return 20;
}
function estimatePrice({ widthCm, extraColorsCount, extraBase = 0 }) {
  const base = basePriceByWidth(widthCm) + extraBase;
  const extra = Math.max(0, extraColorsCount) * 3;
  return { base, extra, total: base + extra };
}

// ---------------- Data (popular) ----------------
const POPULAR_TEXTS = [
  { id:"t1", title:"LOW & SLOW", meta:"Текст • clean", pills:["едноцветно"], preset:{ text:"LOW & SLOW", width:40 } },
  { id:"t2", title:"NO RISK NO FUN", meta:"Текст • спорт", pills:["едноцветно"], preset:{ text:"NO RISK NO FUN", width:60 } },
  { id:"t3", title:"STANCE", meta:"Късо • агресивно", pills:["компактно"], preset:{ text:"STANCE", width:25 } },
  { id:"t4", title:"TURBO", meta:"Късо • clean", pills:["едноцветно"], preset:{ text:"TURBO", width:25 } },
  { id:"t5", title:"TRACK DAY", meta:"Писта • текст", pills:["едноцветно"], preset:{ text:"TRACK DAY", width:50 } },
  { id:"t6", title:"DRIVEN", meta:"Текст • минимал", pills:["популярно"], preset:{ text:"DRIVEN", width:35 } }
];

const AUTO_BY_BRAND = {
  "BMW": [
    { title:"Windshield Banner (BMW)", meta:"Предно стъкло", pills:["банер"], preset:{ route:"avto" } },
    { title:"Side stripes (M-style)", meta:"Странично", pills:["спорт"], preset:{ route:"avto" } },
    { title:"Rear text (BMW club)", meta:"Задно", pills:["минимал"], preset:{ route:"avto" } }
  ],
  "VW": [
    { title:"Windshield Banner (VW)", meta:"Предно", pills:["банер"], preset:{ route:"avto" } },
    { title:"Side text (VAG)", meta:"Странично", pills:["clean"], preset:{ route:"avto" } },
    { title:"Rear small decal", meta:"Задно", pills:["малък"], preset:{ route:"avto" } }
  ],
  "AUDI": [
    { title:"Windshield Banner (AUDI)", meta:"Предно", pills:["банер"], preset:{ route:"avto" } },
    { title:"Side quattro text", meta:"Странично", pills:["clean"], preset:{ route:"avto" } },
    { title:"Rear minimal text", meta:"Задно", pills:["минимал"], preset:{ route:"avto" } }
  ],
  "MERCEDES": [
    { title:"Windshield Banner (MB)", meta:"Предно", pills:["банер"], preset:{ route:"avto" } },
    { title:"Side AMG text", meta:"Странично", pills:["спорт"], preset:{ route:"avto" } },
    { title:"Rear small tag", meta:"Задно", pills:["малък"], preset:{ route:"avto" } }
  ],
  "ДРУГО": [
    { title:"Universal windshield text", meta:"Предно", pills:["универсален"], preset:{ route:"avto" } },
    { title:"Universal side text", meta:"Странично", pills:["универсален"], preset:{ route:"avto" } },
    { title:"Universal rear text", meta:"Задно", pills:["универсален"], preset:{ route:"avto" } }
  ]
};

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function renderCards(gridEl, items, kind) {
  gridEl.innerHTML = "";
  items.forEach(it => {
    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML = `
      <div class="itemTitle">${escapeHtml(it.title)}</div>
      <div class="itemMeta">${escapeHtml(it.meta || "")}</div>
      <div class="itemPillRow">${(it.pills||[]).map(p=>`<span class="pill">${escapeHtml(p)}</span>`).join("")}</div>
      <div class="itemActions">
        <button class="btn btnPrimary" data-action="request" data-kind="${kind}" data-id="${escapeHtml(it.id||"")}">Заяви</button>
      </div>
    `;
    gridEl.appendChild(card);

    card.querySelector('[data-action="request"]').addEventListener("click", () => {
      if (kind === "nadpisi") {
        location.hash = "#nadpisi";
        // switch to custom tab
        setTimeout(() => {
          document.querySelector('[data-tab="nadpisi-custom"]')?.click();
          if (it.preset?.text) document.getElementById("npText").value = it.preset.text;
          if (it.preset?.width) document.getElementById("npWidth").value = it.preset.width;
          updateNadpisi();
        }, 50);
      } else if (kind === "avto") {
        location.hash = "#avto";
      }
    });
  });
}

// ---------------- Nadpisi preview + price ----------------
function updateNadpisi() {
  const text = document.getElementById("npText").value || "YOUR TEXT";
  const width = Number(document.getElementById("npWidth").value || 40);
  const font = document.getElementById("npFont").value;
  const mainColor = document.getElementById("npMainColor").value;
  const extraColors = getExtraColors(document.getElementById("npExtraColorsHidden"));

  const previewText = document.getElementById("npPreviewText");
  previewText.textContent = text;
  previewText.style.fontFamily = `${font}, Roboto, sans-serif`;
  previewText.style.color = mainColor;

  const size = Math.max(18, Math.min(72, width * 1.0));
  previewText.style.fontSize = `${size}px`;
  document.getElementById("npRulerText").textContent = `~${width} см`;

  // extra colors count excludes main color
  const est = estimatePrice({ widthCm: width, extraColorsCount: extraColors.length, extraBase: 0 });
  document.getElementById("npPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extraColors.length} доп. цвят/цвята)`;
}

// ---------------- Stikeri preview + price ----------------
function updateStikeri() {
  const text = document.getElementById("stText").value || "BG STICKERS";
  const width = Number(document.getElementById("stWidth").value || 40);
  const font = document.getElementById("stFont").value;
  const mainColor = document.getElementById("stMainColor").value;
  const extraColors = getExtraColors(document.getElementById("stExtraColorsHidden"));

  const previewText = document.getElementById("stPreviewText");
  previewText.textContent = text;
  previewText.style.fontFamily = `${font}, Roboto, sans-serif`;
  previewText.style.color = mainColor;

  const size = Math.max(18, Math.min(72, width * 1.0));
  previewText.style.fontSize = `${size}px`;
  document.getElementById("stRulerText").textContent = `~${width} см`;

  // +2€ base for design
  const est = estimatePrice({ widthCm: width, extraColorsCount: extraColors.length, extraBase: 2 });
  document.getElementById("stPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extraColors.length} доп. цвят/цвята)`;
}

// ---------------- Gallery ----------------
async function loadGallery() {
  const grid = document.getElementById("galleryGrid");
  const hint = document.getElementById("galleryHint");
  const tagSel = document.getElementById("galleryTag");
  if (!grid || !tagSel) return;

  let data = [];
  try {
    const res = await fetch("gallery.json", { cache: "no-store" });
    data = await res.json();
  } catch {
    hint.textContent = "Няма gallery.json или е празен. Добави файл gallery.json за да се появят проекти.";
    data = [];
  }

  const allTags = new Set();
  data.forEach(x => (x.tags||[]).forEach(t => allTags.add(String(t).toLowerCase())));
  [...allTags].sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagSel.appendChild(opt);
  });

  const render = () => {
    const selected = tagSel.value;
    const filtered = selected === "all" ? data : data.filter(x => (x.tags||[]).map(t=>String(t).toLowerCase()).includes(selected));

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
        ${hasImg ? `<img class="galleryImg" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title||"")}">`
                 : `<div class="galleryPh"></div>`}
        <div class="galleryCap">${escapeHtml(item.title || "")}</div>
        <div class="gallerySub">${escapeHtml(item.caption || "")}</div>
      `;
      grid.appendChild(card);
    });
  };

  tagSel.addEventListener("change", render);
  render();
}

// ---------------- Brand dropdown ----------------
function initBrandDropdown() {
  const sel = document.getElementById("brandSelect");
  if (!sel) return;

  Object.keys(AUTO_BY_BRAND).forEach(b => {
    const opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    sel.appendChild(opt);
  });
  sel.value = "BMW";
  renderCards(document.getElementById("avtoPopularGrid"), AUTO_BY_BRAND[sel.value], "avto");
  sel.addEventListener("change", () => renderCards(document.getElementById("avtoPopularGrid"), AUTO_BY_BRAND[sel.value] || AUTO_BY_BRAND["ДРУГО"], "avto"));
}

// ---------------- Copy summary helpers ----------------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
function buildNadpisiSummary() {
  const text = document.getElementById("npText").value;
  const w = document.getElementById("npWidth").value;
  const h = document.getElementById("npHeight").value;
  const font = document.getElementById("npFont").value;
  const main = document.getElementById("npMainColor").value;
  const extras = getExtraColors(document.getElementById("npExtraColorsHidden"));
  const note = document.querySelector('#formNadpisi textarea[name="note"]').value;
  const price = document.getElementById("npPrice").textContent;
  return `BG STICKERS • НАДПИСИ ПО ПОРЪЧКА
Текст: ${text}
Размер: ${w}см ширина ${h ? ` / ${h}см височина` : ""}
Шрифт: ${font}
Основен цвят: ${main}
Доп. цветове: ${extras.join(", ") || "няма"}
Бележка: ${note || "-"}
Цена (ориент.): ${price}`;
}
function buildStikeriSummary() {
  const text = document.getElementById("stText").value;
  const w = document.getElementById("stWidth").value;
  const h = document.getElementById("stHeight").value;
  const font = document.getElementById("stFont").value;
  const main = document.getElementById("stMainColor").value;
  const extras = getExtraColors(document.getElementById("stExtraColorsHidden"));
  const desc = document.querySelector('#formStikeri textarea[name="description"]').value;
  const price = document.getElementById("stPrice").textContent;
  return `BG STICKERS • СТИКЕРИ ПО ПОРЪЧКА
Текст: ${text}
Размер: ${w}см ширина ${h ? ` / ${h}см височина` : ""}
Шрифт: ${font}
Основен цвят: ${main}
Доп. цветове: ${extras.join(", ") || "няма"}
Описание: ${desc || "-"}
Цена (ориент.): ${price}`;
}

// ---------------- Forms submit ----------------
async function postForm(formEl, hintEl, extra) {
  if (!CONFIG.formEndpoint) {
    hintEl.textContent = `⚠️ Няма formEndpoint. Добави endpoint в app.js. Междувременно: пиши на ${CONFIG.instagram} или ${CONFIG.contactEmail}.`;
    return;
  }
  hintEl.textContent = "Изпращане...";
  const fd = new FormData(formEl);
  Object.entries(extra || {}).forEach(([k,v]) => fd.append(k, v));

  try {
    const res = await fetch(CONFIG.formEndpoint, { method:"POST", body:fd, headers:{ "Accept":"application/json" }});
    if (res.ok) {
      formEl.reset();
      hintEl.textContent = "✅ Заявката е изпратена!";
      const stThumb = document.getElementById("stThumb");
      if (stThumb) { stThumb.style.display = "none"; stThumb.src = ""; }
      updateNadpisi();
      updateStikeri();
    } else {
      hintEl.textContent = "❌ Грешка при изпращане. Опитай пак или пиши директно в Instagram.";
    }
  } catch {
    hintEl.textContent = "❌ Няма връзка / endpoint проблем. Опитай пак или пиши директно.";
  }
}

function initForms() {
  const f1 = document.getElementById("formNadpisi");
  f1?.addEventListener("submit", (e) => { e.preventDefault(); postForm(f1, document.getElementById("npSubmitHint"), { type:"nadpisi_custom" }); });

  const fS = document.getElementById("formStikeri");
  fS?.addEventListener("submit", (e) => { e.preventDefault(); postForm(fS, document.getElementById("stSubmitHint"), { type:"stikeri_custom" }); });

  const f2 = document.getElementById("formAvtoCustom");
  f2?.addEventListener("submit", (e) => { e.preventDefault(); postForm(f2, document.getElementById("avtoSubmitHint"), { type:"avto_custom" }); });

  const f3 = document.getElementById("formPrint");
  f3?.addEventListener("submit", (e) => { e.preventDefault(); postForm(f3, document.getElementById("printSubmitHint"), { type:"print_sticker" }); });

  // Copy buttons
  document.getElementById("npCopy")?.addEventListener("click", async () => {
    const ok = await copyText(buildNadpisiSummary());
    document.getElementById("npSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам (браузър).";
  });
  document.getElementById("stCopy")?.addEventListener("click", async () => {
    const ok = await copyText(buildStikeriSummary());
    document.getElementById("stSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам (браузър).";
  });
  document.getElementById("avCopy")?.addEventListener("click", async () => {
    const text = `BG STICKERS • АВТО ПО ПОРЪЧКА\n(виж попълнените полета във формата)`;
    const ok = await copyText(text);
    document.getElementById("avtoSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам.";
  });
  document.getElementById("prCopy")?.addEventListener("click", async () => {
    const text = `BG STICKERS • ПРИНТ СТИКЕР\n(виж попълнените полета във формата)`;
    const ok = await copyText(text);
    document.getElementById("printSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам.";
  });
}

// ---------------- Tabs ----------------
function initTabs() {
  document.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.closest(".page");
      page.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
      page.querySelectorAll(".tabPanel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const id = btn.dataset.tab === "nadpisi-pop" ? "#tab-nadpisi-pop" : "#tab-nadpisi-custom";
      page.querySelector(id).classList.add("active");
    });
  });
}

// ---------------- Init ----------------
(async function init(){
  document.getElementById("brandName").textContent = CONFIG.brandName;

  const colors = await loadColors();
  renderColorDock(colors);

  fillColorSelect(document.getElementById("npMainColor"), colors);
  fillColorSelect(document.getElementById("stMainColor"), colors);
  fillColorSelect(document.getElementById("avtoColor"), colors);

  renderExtraColors(document.getElementById("npExtraColors"), document.getElementById("npExtraColorsHidden"), colors);
  renderExtraColors(document.getElementById("stExtraColors"), document.getElementById("stExtraColorsHidden"), colors);

  // handlers
  ["npText","npWidth","npFont","npMainColor"].forEach(id => document.getElementById(id)?.addEventListener("input", updateNadpisi));
  ["npText","npWidth","npFont","npMainColor"].forEach(id => document.getElementById(id)?.addEventListener("change", updateNadpisi));
  document.getElementById("npExtraColors")?.addEventListener("change", updateNadpisi);

  ["stText","stWidth","stFont","stMainColor"].forEach(id => document.getElementById(id)?.addEventListener("input", updateStikeri));
  ["stText","stWidth","stFont","stMainColor"].forEach(id => document.getElementById(id)?.addEventListener("change", updateStikeri));
  document.getElementById("stExtraColors")?.addEventListener("change", updateStikeri);

  // thumbnail
  const f = document.getElementById("stFile");
  const img = document.getElementById("stThumb");
  if (f && img) {
    f.addEventListener("change", () => {
      const file = f.files && f.files[0];
      if (!file) { img.style.display = "none"; img.src = ""; return; }
      img.src = URL.createObjectURL(file);
      img.style.display = "block";
    });
  }

  // popular + brand
  renderCards(document.getElementById("nadpisiPopularGrid"), POPULAR_TEXTS, "nadpisi");
  initTabs();
  initBrandDropdown();

  // gallery
  loadGallery();

  // forms
  initForms();

  // router
  const onRoute = () => setActivePage(currentRoute());
  window.addEventListener("hashchange", onRoute);
  onRoute();

  // initial calc
  updateNadpisi();
  updateStikeri();
})();
