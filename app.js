const CONFIG = {
  brandName: "BG STICKERS",
  instagram: "@thebgstickers",
  formEndpoint: "",
  contactEmail: "you@example.com"
};

const FALLBACK_COLORS = [
  { name: "Черно", hex: "#0b0d10" },
  { name: "Бяло", hex: "#f5f7fa" },
  { name: "Жълто", hex: "#ffd400" },
  { name: "Червено", hex: "#ff3b30" },
  { name: "Синьо", hex: "#2f80ed" },
  { name: "Зелено", hex: "#27ae60" },
  { name: "Сребро", hex: "#c0c6cf" },
  { name: "Злато", hex: "#d4af37" }
];

const POPULAR_TEXTS = [
  { title:"LOW & SLOW", meta:"Текст • clean", pills:["едноцветно"], preset:{ text:"LOW & SLOW", width:40 } },
  { title:"NO RISK NO FUN", meta:"Текст • спорт", pills:["едноцветно"], preset:{ text:"NO RISK NO FUN", width:60 } },
  { title:"STANCE", meta:"Късо • агресивно", pills:["компактно"], preset:{ text:"STANCE", width:25 } },
  { title:"TURBO", meta:"Късо • clean", pills:["едноцветно"], preset:{ text:"TURBO", width:25 } },
  { title:"TRACK DAY", meta:"Писта • текст", pills:["едноцветно"], preset:{ text:"TRACK DAY", width:50 } },
  { title:"DRIVEN", meta:"Текст • минимал", pills:["популярно"], preset:{ text:"DRIVEN", width:35 } }
];

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

function currentRoute(){ return (location.hash || "#nachalo").replace("#","") || "nachalo"; }

function setActivePage(route){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  (document.querySelector(`#page-${route}`) || document.querySelector("#page-nachalo"))?.classList.add("active");
  document.querySelectorAll(".navLink").forEach(a => a.classList.toggle("active", a.dataset.route === route));
}

async function safeFetchJson(path){
  try{
    const res = await fetch(path, { cache:"no-store" });
    if(!res.ok) throw new Error();
    return await res.json();
  }catch{
    return null;
  }
}

async function loadColors(){
  const ls = localStorage.getItem("vinyl_colors_override");
  if(ls){
    try { return JSON.parse(ls); } catch {}
  }
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
  const y = colors.find(c => c.name.toLowerCase().includes("жъл"));
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

// Pricing
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

// Надписи
function updateNadpisi(){
  const text = $("npText")?.value || "YOUR TEXT";
  const width = Number($("npWidth")?.value || 40);
  const font = $("npFont")?.value || "Roboto";
  const mainColor = $("npMainColor")?.value || "#ffd400";
  const extras = getExtraColors($("npExtraColorsHidden"));

  const p = $("npPreviewText");
  if(p){
    p.textContent = text;
    p.style.fontFamily = `${font}, Roboto, sans-serif`;
    p.style.color = mainColor; // preview ONLY main color
    p.style.fontSize = `${Math.max(18, Math.min(72, width))}px`;
  }
  $("npRulerText") && ($("npRulerText").textContent = `~${width} см`);

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 0 });
  $("npPrice") && ($("npPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extras.length} доп.)`);
}

// Стикери
function updateStikeri(){
  const text = $("stText")?.value || "BG STICKERS";
  const width = Number($("stWidth")?.value || 40);
  const font = $("stFont")?.value || "Roboto";
  const mainColor = $("stMainColor")?.value || "#ffd400";
  const extras = getExtraColors($("stExtraColorsHidden"));

  const p = $("stPreviewText");
  if(p){
    p.textContent = text;
    p.style.fontFamily = `${font}, Roboto, sans-serif`;
    p.style.color = mainColor; // preview ONLY main color
    p.style.fontSize = `${Math.max(18, Math.min(72, width))}px`;
  }
  $("stRulerText") && ($("stRulerText").textContent = `~${width} см`);

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 2 });
  $("stPrice") && ($("stPrice").textContent = `${est.total}€ (база ${est.base}€ + ${est.extra}€ за ${extras.length} доп.)`);
}

// Tabs init for НАДПИСИ
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

// Render popular cards (НАДПИСИ)
function renderNadpisiPopular(){
  const grid = $("nadpisiPopularGrid");
  if(!grid) return;
  grid.innerHTML = "";

  POPULAR_TEXTS.forEach(it=>{
    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML = `
      <div class="itemTitle">${escapeHtml(it.title)}</div>
      <div class="itemMeta">${escapeHtml(it.meta || "")}</div>
      <div class="itemPillRow">${(it.pills||[]).map(p=>`<span class="pill">${escapeHtml(p)}</span>`).join("")}</div>
      <div class="itemActions">
        <button class="btn btnPrimary">Заяви</button>
      </div>
    `;
    card.querySelector("button")?.addEventListener("click", ()=>{
      // Switch to custom tab and prefill
      location.hash = "#nadpisi";
      setTimeout(()=>{
        document.querySelector('[data-tab="nadpisi-custom"]')?.click();
        if(it.preset?.text) $("npText").value = it.preset.text;
        if(it.preset?.width) $("npWidth").value = it.preset.width;
        updateNadpisi();
      }, 60);
    });
    grid.appendChild(card);
  });
}

// Auto brand dropdown stays as before
function initBrandDropdown(){
  const sel = $("brandSelect");
  const grid = $("avtoPopularGrid");
  if(!sel || !grid) return;

  sel.innerHTML = "";
  Object.keys(AUTO_BY_BRAND).forEach(b=>{
    const opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    sel.appendChild(opt);
  });
  sel.value = "BMW";

  const render = () => {
    grid.innerHTML = "";
    (AUTO_BY_BRAND[sel.value] || AUTO_BY_BRAND["ДРУГО"]).forEach(it=>{
      const card = document.createElement("div");
      card.className = "itemCard";
      card.innerHTML = `
        <div class="itemTitle">${escapeHtml(it.title)}</div>
        <div class="itemMeta">${escapeHtml(it.meta || "")}</div>
        <div class="itemPillRow">${(it.pills||[]).map(p=>`<span class="pill">${escapeHtml(p)}</span>`).join("")}</div>
      `;
      grid.appendChild(card);
    });
  };

  sel.addEventListener("change", render);
  render();
}

window.addEventListener("DOMContentLoaded", async ()=>{
  const colors = await loadColors();

  renderColorDock(colors);
  fillColorSelect($("npMainColor"), colors);
  fillColorSelect($("stMainColor"), colors);
  fillColorSelect($("avtoColor"), colors);

  // Надписи extra colors (normal block)
  renderExtraColors($("npExtraColors"), $("npExtraColorsHidden"), colors, null);

  // Стикери extra colors (dropdown block)
  renderExtraColors($("stExtraColors"), $("stExtraColorsHidden"), colors, $("stExtraColorsSummary"));

  initTabs();
  renderNadpisiPopular();
  initBrandDropdown();

  // Bind inputs
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

  // Thumbnail for stikeri
  const f = $("stFile");
  const img = $("stThumb");
  if(f && img){
    f.addEventListener("change", ()=>{
      const file = f.files && f.files[0];
      if(!file){ img.style.display="none"; img.src=""; return; }
      img.src = URL.createObjectURL(file);
      img.style.display="block";
    });
  }

  // Router
  const onRoute = () => setActivePage(currentRoute());
  window.addEventListener("hashchange", onRoute);
  onRoute();

  // initial
  updateNadpisi();
  updateStikeri();
});
