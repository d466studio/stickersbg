const CONFIG = {
  brandName: "BG STICKERS",
  instagram: "@thebgstickers",
  formEndpoint: "", // optional: Formspree/Getform endpoint
  contactEmail: "you@example.com"
};

const FALLBACK_COLORS = [
  { name: "Черно", hex: "#0b0d10" },
  { name: "Бяло", hex: "#f5f7fa" },
  { name: "Жълто", hex: "#ffd400" },
  { name: "Червено", hex: "#ff3b30" },
  { name: "Синьо", hex: "#2f80ed" },
  { name: "Зелено", hex: "#27ae60" }
];

const POPULAR_TEXTS = [
  { id:"low-slow", title:"LOW & SLOW", meta:"Текст • clean", pills:["едноцветно"], image:"assets/popular/low-slow.svg", preset:{ text:"LOW & SLOW", width:40 } },
  { id:"no-risk-no-fun", title:"NO RISK NO FUN", meta:"Текст • спорт", pills:["едноцветно"], image:"assets/popular/no-risk-no-fun.svg", preset:{ text:"NO RISK NO FUN", width:60 } },
  { id:"stance", title:"STANCE", meta:"Късо • агресивно", pills:["компактно"], image:"assets/popular/stance.svg", preset:{ text:"STANCE", width:25 } },
  { id:"turbo", title:"TURBO", meta:"Късо • clean", pills:["едноцветно"], image:"assets/popular/turbo.svg", preset:{ text:"TURBO", width:25 } },
  { id:"track-day", title:"TRACK DAY", meta:"Писта • текст", pills:["едноцветно"], image:"assets/popular/track-day.svg", preset:{ text:"TRACK DAY", width:50 } },
  { id:"driven", title:"DRIVEN", meta:"Текст • минимал", pills:["популярно"], image:"assets/popular/driven.svg", preset:{ text:"DRIVEN", width:35 } }
];

// NADPISI modes: custom text vs ready-made popular preset
let NP_MODE = "custom"; // "custom" | "popular"
let NP_SELECTED_POPULAR = null;

const AUTO_BY_BRAND = {
  "BMW": [
    { title:"Windshield Banner (BMW)", meta:"Предно стъкло", pills:["банер"] },
    { title:"Side stripes (M-style)", meta:"Странично", pills:["спорт"] },
    { title:"Rear text (BMW club)", meta:"Задно", pills:["минимал"] }
  ],
  "VW": [
    { title:"Windshield Banner (VW)", meta:"Предно", pills:["банер"] },
    { title:"Side text (VAG)", meta:"Странично", pills:["clean"] },
    { title:"Rear small decal", meta:"Задно", pills:["малък"] }
  ],
  "AUDI": [
    { title:"Windshield Banner (AUDI)", meta:"Предно", pills:["банер"] },
    { title:"Side quattro text", meta:"Странично", pills:["clean"] },
    { title:"Rear minimal text", meta:"Задно", pills:["минимал"] }
  ],
  "MERCEDES": [
    { title:"Windshield Banner (MB)", meta:"Предно", pills:["банер"] },
    { title:"Side AMG text", meta:"Странично", pills:["спорт"] },
    { title:"Rear small tag", meta:"Задно", pills:["малък"] }
  ],
  "ДРУГО": [
    { title:"Universal windshield text", meta:"Предно", pills:["универсален"] },
    { title:"Universal side text", meta:"Странично", pills:["универсален"] },
    { title:"Universal rear text", meta:"Задно", pills:["универсален"] }
  ]
};

const $ = (id) => document.getElementById(id);

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function isBlackHex(hex){
  const h = String(hex || "").trim().toLowerCase();
  return h === "#000" || h === "#000000" || h === "#0b0d10";
}

function setPreviewBoxContrast(previewTextEl, mainColorHex){
  // When user selects black text, switch preview background to white for readability.
  const box = previewTextEl?.closest(".previewBox");
  if(!box) return;
  if(isBlackHex(mainColorHex)){
    box.style.background = "#ffffff";
    box.style.borderColor = "rgba(0,0,0,.22)";
  }else{
    box.style.background = "";
    box.style.borderColor = "";
  }
}

// Font upload (TTF/OTF/WOFF/WOFF2) using the FontFace API.

// Persist uploaded fonts per-user (this browser) via IndexedDB.
// - Fonts remain available after refresh / reopen.
// - Fonts stay only on the current device/browser (not shared, not server-stored).
const FONT_DB_NAME = "bg_stickers_fonts";
const FONT_DB_VERSION = 1;
const FONT_STORE = "fonts";

function openFontDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(FONT_DB_NAME, FONT_DB_VERSION);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if(!db.objectStoreNames.contains(FONT_STORE)){
        db.createObjectStore(FONT_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}

async function saveFontToDB({ id, family, fileName, mime, buffer }){
  const db = await openFontDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(FONT_STORE, "readwrite");
    tx.objectStore(FONT_STORE).put({ id, family, fileName, mime, buffer, savedAt: Date.now() });
    tx.oncomplete = ()=> resolve(true);
    tx.onerror = ()=> reject(tx.error);
  });
}

async function loadAllFontsFromDB(){
  const db = await openFontDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(FONT_STORE, "readonly");
    const req = tx.objectStore(FONT_STORE).getAll();
    req.onsuccess = ()=> resolve(req.result || []);
    req.onerror = ()=> reject(req.error);
  });
}

async function registerFontFaceFromBuffer(family, buffer, mime){
  const blob = new Blob([buffer], { type: mime || "font/ttf" });
  const url = URL.createObjectURL(blob);
  const face = new FontFace(family, `url(${url})`);
  await face.load();
  document.fonts.add(face);
  // Note: keep the blob URL alive for the session. (Revoking it would break the font.)
  return true;
}

function _fontIdFromFile(file){
  return `${file.name}__${file.size}__${file.lastModified}`;
}

function _hashStringDjb2(str){
  let h = 5381;
  for(let i=0;i<str.length;i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  // unsigned 32-bit
  return (h >>> 0).toString(36);
}
function _sanitizeFontFamily(name){
  return String(name || "Custom Font")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9À-ɏЀ-ӿ\s]/g, "")
    .trim() || "Custom Font";
}

function _stableUserFontFamily(file){
  // Create a stable family name so a saved font reloads with the same name.
  // Prefix avoids collisions with system fonts.
  const base = _sanitizeFontFamily(file?.name);
  const id = _fontIdFromFile(file);
  const h = _hashStringDjb2(id);
  return `User: ${base} (${h})`;
}

function _ensureUploadedOptgroup(selectEl){
  if(!selectEl) return null;
  let g = selectEl.querySelector('optgroup[data-uploaded="1"]');
  if(g) return g;
  g = document.createElement('optgroup');
  g.label = "Качени";
  g.setAttribute('data-uploaded', '1');
  selectEl.insertBefore(g, selectEl.firstChild);
  return g;
}

function _addFontOption(selectEl, family){
  const g = _ensureUploadedOptgroup(selectEl);
  // Prevent duplicates
  const exists = Array.from(selectEl.options).some(o => (o.value || "") === family);
  if(exists) return;
  const opt = document.createElement('option');
  opt.value = family;
  opt.textContent = family;
  g.appendChild(opt);
}

async function loadAndRegisterUserFont(file){
  if(!file) return null;
  const family = _stableUserFontFamily(file);
  const buf = await file.arrayBuffer();
  // Use buffer-based registration (more consistent across mime types)
  await registerFontFaceFromBuffer(family, buf, file.type);
  return { family, buffer: buf };
}

async function bootstrapSavedFonts(){
  if(!('indexedDB' in window) || !('FontFace' in window) || !document.fonts) return;
  try{
    const saved = await loadAllFontsFromDB();
    if(!Array.isArray(saved) || !saved.length) return;
    for(const f of saved){
      try{
        await registerFontFaceFromBuffer(f.family, f.buffer, f.mime);
        ['npFont','stFont'].forEach(id => _addFontOption($(id), f.family));
      }catch(err){
        console.warn('Failed to load saved font', f?.family, err);
      }
    }
  }catch(err){
    console.warn('Font DB bootstrap failed', err);
  }
}

function initFontUploads(){
  const inputs = [
    { inputId:'npFontUpload', selectId:'npFont', hintId:'npFontUploadHint', onUpdate:updateNadpisi },
    { inputId:'stFontUpload', selectId:'stFont', hintId:'stFontUploadHint', onUpdate:updateStikeri },
  ];

  inputs.forEach(({inputId, selectId, hintId, onUpdate})=>{
    const inp = $(inputId);
    const sel = $(selectId);
    const hint = $(hintId);
    if(!inp || !sel) return;

    inp.addEventListener('change', async ()=>{
      const file = inp.files && inp.files[0];
      if(!file) return;

      if(!('FontFace' in window) || !document.fonts){
        if(hint) hint.textContent = "Този браузър не поддържа зареждане на шрифтове директно.";
        return;
      }

      const okTypes = ['font/ttf','font/otf','font/woff','font/woff2','application/font-woff','application/font-woff2','application/octet-stream'];
      const extOk = /\.(ttf|otf|woff|woff2)$/i.test(file.name);
      if(!extOk && !okTypes.includes(file.type)){
        if(hint) hint.textContent = "Моля качи TTF/OTF/WOFF/WOFF2 файл.";
        inp.value = "";
        return;
      }

      try{
        if(hint) hint.textContent = "Зареждам шрифта…";
        const loaded = await loadAndRegisterUserFont(file);
        if(!loaded?.family) throw new Error('no family');
        const family = loaded.family;
        // Add to both designers so it appears everywhere.
        ['npFont','stFont'].forEach(id => _addFontOption($(id), family));
        sel.value = family;

        // Persist for this browser
        if('indexedDB' in window){
          const id = _fontIdFromFile(file);
          await saveFontToDB({ id, family, fileName: file.name, mime: file.type, buffer: loaded.buffer });
        }

        if(hint) hint.textContent = `✅ Добавен шрифт: ${family}`;
        onUpdate && onUpdate();
      }catch(err){
        console.error(err);
        if(hint) hint.textContent = "❌ Не успях да заредя този шрифт. Опитай друг файл (woff2/ttf).";
      }finally{
        inp.value = ""; // allow re-upload same file
      }
    });
  });
}

function currentRoute(){ return (location.hash || "#nachalo").replace("#","") || "nachalo"; }

function setActivePage(route){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  (document.querySelector(`#page-${route}`) || document.querySelector("#page-nachalo"))?.classList.add("active");
  document.querySelectorAll(".navLink").forEach(a => a.classList.toggle("active", a.dataset.route === route));
}

async function safeFetchJson(path){
  try{
    const res = await fetch(path, { cache:"no-store" });
    if(!res.ok) throw new Error(`${path} ${res.status}`);
    return await res.json();
  }catch{
    return null;
  }
}

async function loadColors(){
  const ls = localStorage.getItem("vinyl_colors_override");
  if(ls){ try { return JSON.parse(ls); } catch {} }
  const json = await safeFetchJson("colors.json");
  return Array.isArray(json) && json.length ? json : FALLBACK_COLORS;
}

function renderColorDock(colors){
  const sw = $("swatches");
  if(!sw) return;
  sw.innerHTML = "";
  colors.forEach(c=>{
    const el = document.createElement("div");
    el.className = "swatch";
    el.style.background = c.hex;
    el.dataset.tip = `${c.name} • ${c.hex}`;
    sw.appendChild(el);
  });
}

function fillColorSelect(selectEl, colors){
  if(!selectEl) return;
  selectEl.innerHTML = "";
  colors.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c.hex;
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  });
  const y = colors.find(c=>c.name.toLowerCase().includes("жъл"));
  if(y) selectEl.value = y.hex;
}

function renderExtraColors(containerEl, hiddenEl, colors, summaryEl){
  if(!containerEl || !hiddenEl) return;
  containerEl.innerHTML = "";

  colors.forEach(c=>{
    const id = `x_${Math.random().toString(16).slice(2)}`;
    const label = document.createElement("label");
    label.className = "colorChk";
    label.setAttribute("for", id);

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = id;
    cb.value = c.hex;

    const dot = document.createElement("span");
    dot.className = "colorDot";
    dot.style.background = c.hex;

    const txt = document.createElement("span");
    txt.textContent = c.name;

    label.appendChild(cb); label.appendChild(dot); label.appendChild(txt);
    containerEl.appendChild(label);
  });

  const sync = () => {
    const chosen = [...containerEl.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);
    hiddenEl.value = chosen.join(",");
    if(summaryEl){
      summaryEl.textContent = chosen.length ? `Доп. цветове: ${chosen.length} избрани` : "Избери доп. цветове";
    }
    return chosen;
  };
  containerEl.addEventListener("change", sync);
  sync();
}

function getExtraColors(hiddenEl){
  const v = (hiddenEl?.value || "").trim();
  if(!v) return [];
  return v.split(",").map(s=>s.trim()).filter(Boolean);
}

// Pricing rules
function basePriceByWidth(widthCm){
  const w = Number(widthCm || 0);
  if (w <= 10) return 10;
  if (w <= 50) return 15;
  if (w <= 100) return 17;
  if (w <= 150) return 20;
  if (w <= 200) return 20;
  return 20;
}
function estimatePrice({ widthCm, extraColorsCount, extraBase = 0 }){
  const base = basePriceByWidth(widthCm) + extraBase;
  const extra = Math.max(0, extraColorsCount) * 3;
  return { base, extra, total: base + extra };
}

// Live previews
function updateNadpisi(){
  const text = $("npText")?.value || "";
  const width = Number($("npWidth")?.value || 40);
  const font = $("npFont")?.value || "Roboto";
  const mainColor = $("npMainColor")?.value || "#ffd400";
  const extras = NP_MODE === "popular" ? [] : getExtraColors($("npExtraColorsHidden"));

  // In popular mode we show a ready-made sticker image (asset), not editable text.
  const readyImg = $("npReadyImg");
  const previewText = $("npPreviewText");
  if(NP_MODE === "popular" && NP_SELECTED_POPULAR?.image){
    if(readyImg){
      readyImg.src = NP_SELECTED_POPULAR.image;
      readyImg.style.display = "block";
    }
    if(previewText) previewText.style.display = "none";
  }else{
    if(readyImg) readyImg.style.display = "none";
    if(previewText) previewText.style.display = "block";
  }

  const p = previewText;
  if(p){
    p.textContent = text || "";
    p.style.fontFamily = `${font}, Roboto, Inter, Arial, Helvetica, sans-serif`;
    p.style.color = mainColor;
    p.style.fontSize = `${Math.max(18, Math.min(72, width))}px`;
    setPreviewBoxContrast(p, mainColor);
  }
  if($("npRulerText")) $("npRulerText").textContent = `~${width} см`;

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 0 });
  if($("npPrice")) $("npPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extras.length} доп.)`;
}

function updateStikeri(){
  const text = ($("stText")?.value || "").trim();
  const width = Number($("stWidth")?.value || 40);
  const font = $("stFont")?.value || "Roboto";
  const mainColor = $("stMainColor")?.value || "#ffd400";
  const extras = getExtraColors($("stExtraColorsHidden"));

  const p = $("stPreviewText");
  if(p){
    // If user wants ONLY the uploaded image and didn't enter text, don't show default text.
    p.textContent = text;
    p.style.display = text ? "block" : "none";
    p.style.fontFamily = `${font}, Roboto, Inter, Arial, Helvetica, sans-serif`;
    p.style.color = mainColor;
    p.style.fontSize = `${Math.max(18, Math.min(72, width))}px`;
    setPreviewBoxContrast(p, mainColor);
  }
  if($("stRulerText")) $("stRulerText").textContent = `~${width} см`;

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 2 });
  if($("stPrice")) $("stPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extras.length} доп.)`;
}

function setNadpisiMode(mode, popularItem){
  NP_MODE = mode === "popular" ? "popular" : "custom";
  NP_SELECTED_POPULAR = NP_MODE === "popular" ? (popularItem || null) : null;

  const notice = $("npPopularNotice");
  const noticeTitle = $("npPopularTitle");
  const hiddenPreset = $("npPopularPreset");

  // Fields that are not allowed in popular mode
  const hideIds = ["npText", "npHeight", "npFont", "npExtraColors"];
  hideIds.forEach(id=>{
    const el = $(id);
    const wrap = el?.closest("label") || el?.closest(".colorMulti")?.closest("label");
    if(!wrap) return;
    wrap.style.display = NP_MODE === "popular" ? "none" : "";
  });

  // Disable inputs (even if visible due to custom layout changes)
  ["npText","npHeight","npFont"].forEach(id=>{
    const el = $(id);
    if(el) el.disabled = NP_MODE === "popular";
  });
  const extraHidden = $("npExtraColorsHidden");
  if(NP_MODE === "popular" && extraHidden) extraHidden.value = "";

  // In popular mode we keep only width + mainColor
  if(NP_MODE === "popular"){
    if(notice) notice.style.display = "block";
    if(noticeTitle) noticeTitle.textContent = popularItem?.title || "Готов надпис";
    if(hiddenPreset) hiddenPreset.value = popularItem?.id || popularItem?.title || "";

    // Ensure required text doesn't block submit
    const txt = $("npText");
    if(txt){ txt.required = false; txt.value = popularItem?.preset?.text || ""; }
    // Set a sensible default width
    if(popularItem?.preset?.width) $("npWidth").value = popularItem.preset.width;
  }else{
    if(notice) notice.style.display = "none";
    if(hiddenPreset) hiddenPreset.value = "";
    const txt = $("npText");
    if(txt) txt.required = true;
  }

  updateNadpisi();
}

// Tabs
function initTabs(){
  document.querySelectorAll(".tabBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const page = btn.closest(".page");
      if(!page) return;
      page.querySelectorAll(".tabBtn").forEach(b=>b.classList.remove("active"));
      page.querySelectorAll(".tabPanel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.dataset.tab === "nadpisi-pop" ? "tab-nadpisi-pop" : "tab-nadpisi-custom";
      document.getElementById(targetId)?.classList.add("active");
    });
  });
}

// Popular cards
function renderPopular(gridEl, items, onRequest){
  if(!gridEl) return;
  gridEl.innerHTML = "";
  items.forEach(it=>{
    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML = `
      ${it.image ? `<div class="itemImgWrap"><img class="itemImg" src="${escapeHtml(it.image)}" alt=""></div>` : ``}
      <div class="itemTitle">${escapeHtml(it.title)}</div>
      <div class="itemMeta">${escapeHtml(it.meta || "")}</div>
      <div class="itemPillRow">${(it.pills||[]).map(p=>`<span class="pill">${escapeHtml(p)}</span>`).join("")}</div>
      ${onRequest ? `<div class="itemActions"><button class="btn btnPrimary">Заяви</button></div>` : ``}
    `;
    if(onRequest){
      card.querySelector("button")?.addEventListener("click", ()=>onRequest(it));
    }
    gridEl.appendChild(card);
  });
}

function renderNadpisiPopular(){
  renderPopular($("nadpisiPopularGrid"), POPULAR_TEXTS, (it)=>{
    location.hash = "#nadpisi";
    setTimeout(()=>{
      document.querySelector('[data-tab="nadpisi-custom"]')?.click();
      setNadpisiMode("popular", it);
    }, 60);
  });
}

function initBrandDropdown(){
  const sel = $("brandSelect");
  if(!sel) return;
  sel.innerHTML = "";
  Object.keys(AUTO_BY_BRAND).forEach(b=>{
    const opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    sel.appendChild(opt);
  });
  sel.value = "BMW";
  const render = ()=> renderPopular($("avtoPopularGrid"), AUTO_BY_BRAND[sel.value] || AUTO_BY_BRAND["ДРУГО"], null);
  sel.addEventListener("change", render);
  render();
}

// Gallery
async function initGallery(){
  const grid = $("galleryGrid");
  const tagSel = $("galleryTag");
  if(!grid || !tagSel) return;

  const data = await safeFetchJson("gallery.json");
  const items = Array.isArray(data) ? data : [];
  const tags = new Set();
  items.forEach(x => (x.tags||[]).forEach(t => tags.add(String(t).toLowerCase())));
  tagSel.innerHTML = `<option value="all">Всички</option>`;
  [...tags].sort().forEach(t=>{
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    tagSel.appendChild(opt);
  });

  const render = ()=>{
    const sel = tagSel.value;
    const filtered = sel==="all" ? items : items.filter(x => (x.tags||[]).map(t=>String(t).toLowerCase()).includes(sel));
    grid.innerHTML = "";
    if(!filtered.length){
      grid.innerHTML = `<div class="muted small">Няма проекти (добави в gallery.json).</div>`;
      return;
    }
    filtered.forEach(item=>{
      const card = document.createElement("div");
      card.className = "galleryItem";
      const hasImg = item.image && String(item.image).trim();
      card.innerHTML = `
        ${hasImg ? `<img class="galleryImg" src="${escapeHtml(item.image)}" alt="">` : `<div class="galleryPh"></div>`}
        <div class="galleryCap">${escapeHtml(item.title||"")}</div>
        <div class="gallerySub">${escapeHtml(item.caption||"")}</div>
      `;
      grid.appendChild(card);
    });
  };

  tagSel.addEventListener("change", render);
  render();
}

// Copy helpers
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true; }
  catch{ return false; }
}
function buildNadpisiSummary(){
  const text = $("npText")?.value || "";
  const w = $("npWidth")?.value || "";
  const h = $("npHeight")?.value || "";
  const font = $("npFont")?.value || "";
  const main = $("npMainColor")?.value || "";
  const extras = getExtraColors($("npExtraColorsHidden"));
  const note = document.querySelector('#formNadpisi textarea[name="note"]')?.value || "";
  const price = $("npPrice")?.textContent || "";
  return `BG STICKERS • НАДПИСИ ПО ПОРЪЧКА
Текст: ${text}
Размер: ${w}см ${h ? `/ ${h}см` : ""}
Шрифт: ${font}
Основен цвят: ${main}
Доп. цветове: ${extras.join(", ") || "няма"}
Бележка: ${note || "-"}
Цена (ориент.): ${price}`;
}
function buildStikeriSummary(){
  const text = $("stText")?.value || "";
  const w = $("stWidth")?.value || "";
  const h = $("stHeight")?.value || "";
  const font = $("stFont")?.value || "";
  const main = $("stMainColor")?.value || "";
  const extras = getExtraColors($("stExtraColorsHidden"));
  const desc = document.querySelector('#formStikeri textarea[name="description"]')?.value || "";
  const price = $("stPrice")?.textContent || "";
  return `BG STICKERS • СТИКЕРИ ПО ПОРЪЧКА
Текст: ${text}
Размер: ${w}см ${h ? `/ ${h}см` : ""}
Шрифт: ${font}
Основен цвят: ${main}
Доп. цветове: ${extras.join(", ") || "няма"}
Описание: ${desc || "-"}
Цена (ориент.): ${price}`;
}

// Optional submit
async function postForm(formEl, hintEl, extra){
  if(!CONFIG.formEndpoint){
    hintEl.textContent = `⚠️ Няма formEndpoint. Добави endpoint в app.js. Междувременно: ${CONFIG.instagram} / ${CONFIG.contactEmail}.`;
    return;
  }
  hintEl.textContent = "Изпращане...";
  const fd = new FormData(formEl);
  Object.entries(extra || {}).forEach(([k,v]) => fd.append(k, v));
  try{
    const res = await fetch(CONFIG.formEndpoint, { method:"POST", body:fd, headers:{ "Accept":"application/json" }});
    hintEl.textContent = res.ok ? "✅ Заявката е изпратена!" : "❌ Грешка при изпращане.";
    if(res.ok) formEl.reset();
  }catch{
    hintEl.textContent = "❌ Няма връзка / endpoint проблем.";
  }
}

window.addEventListener("DOMContentLoaded", async ()=>{
  const colors = await loadColors();
  renderColorDock(colors);
  fillColorSelect($("npMainColor"), colors);
  fillColorSelect($("stMainColor"), colors);
  fillColorSelect($("avtoColor"), colors);

  renderExtraColors($("npExtraColors"), $("npExtraColorsHidden"), colors, null);
  renderExtraColors($("stExtraColors"), $("stExtraColorsHidden"), colors, $("stExtraColorsSummary"));

  initTabs();
  renderNadpisiPopular();
  setNadpisiMode("custom");
  initBrandDropdown();
  initGallery();
  initFontUploads();
  // Load any previously uploaded fonts for this browser/device.
  await bootstrapSavedFonts();

  ["npText","npWidth","npFont","npMainColor"].forEach(id=>{
    $(id)?.addEventListener("input", updateNadpisi);
    $(id)?.addEventListener("change", updateNadpisi);
  });
  $("npExtraColors")?.addEventListener("change", updateNadpisi);

  ["stText","stWidth","stFont","stMainColor"].forEach(id=>{
    $(id)?.addEventListener("input", updateStikeri);
    $(id)?.addEventListener("change", updateStikeri);
  });
  $("stExtraColors")?.addEventListener("change", updateStikeri);

  const f = $("stFile"), img = $("stThumb");
  if(f && img){
    f.addEventListener("change", ()=>{
      const file = f.files && f.files[0];
      if(!file){ img.style.display="none"; img.src=""; return; }
      img.src = URL.createObjectURL(file);
      img.style.display="block";
    });
  }

  $("npBackToCustomBtn")?.addEventListener("click", ()=> setNadpisiMode("custom"));

  $("npCopy")?.addEventListener("click", async ()=>{
    const ok = await copyText(buildNadpisiSummary());
    $("npSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам.";
  });
  $("stCopy")?.addEventListener("click", async ()=>{
    const ok = await copyText(buildStikeriSummary());
    $("stSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам.";
  });
  $("avCopy")?.addEventListener("click", async ()=>{
    const ok = await copyText("BG STICKERS • АВТО ПО ПОРЪЧКА (виж полетата)");
    $("avtoSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам.";
  });
  $("prCopy")?.addEventListener("click", async ()=>{
    const ok = await copyText("BG STICKERS • ПРИНТ СТИКЕР (виж полетата)");
    $("printSubmitHint").textContent = ok ? "📋 Копирано!" : "❌ Не успях да копирам.";
  });

  $("formNadpisi")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const type = NP_MODE === "popular" ? "nadpisi_popular" : "nadpisi_custom";
    postForm($("formNadpisi"), $("npSubmitHint"), { type });
  });
  $("formStikeri")?.addEventListener("submit", (e)=>{ e.preventDefault(); postForm($("formStikeri"), $("stSubmitHint"), { type:"stikeri_custom" }); });
  $("formAvtoCustom")?.addEventListener("submit", (e)=>{ e.preventDefault(); postForm($("formAvtoCustom"), $("avtoSubmitHint"), { type:"avto_custom" }); });
  $("formPrint")?.addEventListener("submit", (e)=>{ e.preventDefault(); postForm($("formPrint"), $("printSubmitHint"), { type:"print_sticker" }); });

  const onRoute = () => setActivePage(currentRoute());
  window.addEventListener("hashchange", onRoute);
  onRoute();

  updateNadpisi();
  updateStikeri();
});
