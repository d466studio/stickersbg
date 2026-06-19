// UI/editor helpers: fonts, previews, popular items, gallery, colors.

// Popular texts - meta and pills will be translated dynamically


// --- Text flow rendering (single line vs word-per-line) ---
// IMPORTANT: Preview must derive final text from layer.textRaw + layer.textFlow.
// We keep layer.text as a compatibility field, but always recompute when rendering.
function stApplyTextRules(raw, flow, ruleHintEl) {
  const f = (flow === "words") ? "words" : "single";
  let out = String(raw ?? "");
  if (f === "words") {
    const words = out.replace(/\r?\n/g, " ").trim().split(/\s+/).filter(Boolean).slice(0, 12);
    out = words.join("\n");
    if (ruleHintEl) ruleHintEl.textContent = "Word per line (max 12 words).";
  } else {
    out = out.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim();
    // Keep as a single line; do not force wrapping.
    out = out.slice(0, 80);
    if (ruleHintEl) ruleHintEl.textContent = "One line (scroll if long, max 80 chars).";
  }
  // Keep cleanliness while still allowing longer inputs.
  // - single: one line only (preview can scroll horizontally)
  // - words: max 12 lines (one word per line)
  const maxLines = f === "words" ? 12 : 1;
  return String(out).split(/\r?\n/).slice(0, maxLines).join("\n");
}

// Legacy: auto-fit used in earlier iterations. Kept intentionally as a no-op helper
// for backwards compatibility if referenced elsewhere.
function stAutoFitText(tEl, maxW, maxH, minPx) {
  if (!tEl) return;
  const minSize = Math.max(10, isFinite(minPx) ? minPx : 14);
  // Reset to allow measuring.
  const startPx = parseFloat(String(tEl.style.fontSize || "0").replace("px", "")) || 48;
  tEl.style.fontSize = startPx + "px";

  // In some browsers, measurements need a layout flush.
  // eslint-disable-next-line no-unused-expressions
  tEl.offsetHeight;

  const sw = tEl.scrollWidth;
  const sh = tEl.scrollHeight;
  if (!sw || !sh) return;

  const r = Math.min(maxW / sw, maxH / sh, 1);
  const next = Math.floor(startPx * r);
  tEl.style.fontSize = Math.max(minSize, next) + "px";
}
const POPULAR_TEXTS = [
  { id: "low-slow", title: "LOW & SLOW", metaKey: "popularMeta.textClean", pills: ["pills.singleColor"], image: "assets/popular/low-slow.svg", preset: { text: "LOW & SLOW", width: 40 } },
  { id: "no-risk-no-fun", title: "NO RISK NO FUN", metaKey: "popularMeta.textSport", pills: ["pills.singleColor"], image: "assets/popular/no-risk-no-fun.svg", preset: { text: "NO RISK NO FUN", width: 60 } },
  { id: "stance", title: "STANCE", metaKey: "popularMeta.shortAggressive", pills: ["pills.compact"], image: "assets/popular/stance.svg", preset: { text: "STANCE", width: 25 } },
  { id: "turbo", title: "TURBO", metaKey: "popularMeta.shortClean", pills: ["pills.singleColor"], image: "assets/popular/turbo.svg", preset: { text: "TURBO", width: 25 } },
  { id: "track-day", title: "TRACK DAY", metaKey: "popularMeta.trackText", pills: ["pills.singleColor"], image: "assets/popular/track-day.svg", preset: { text: "TRACK DAY", width: 50 } },
  { id: "driven", title: "DRIVEN", metaKey: "popularMeta.textMinimal", pills: ["pills.popular"], image: "assets/popular/driven.svg", preset: { text: "DRIVEN", width: 35 } }
];

// NADPISI modes: custom text vs ready-made popular preset
let NP_MODE = "custom"; // "custom" | "popular"
let NP_SELECTED_POPULAR = null;

const AUTO_BY_BRAND = {
  BMW: [
    { title: "Windshield Banner (BMW)", metaKey: "autoMeta.windshield", pills: ["pills.banner"] },
    { title: "Side stripes (M-style)", metaKey: "autoMeta.side", pills: ["pills.sport"] },
    { title: "Rear text (BMW club)", metaKey: "autoMeta.rear", pills: ["pills.minimal"] }
  ],
  VW: [
    { title: "Windshield Banner (VW)", metaKey: "autoMeta.front", pills: ["pills.banner"] },
    { title: "Side text (VAG)", metaKey: "autoMeta.side", pills: ["pills.clean"] },
    { title: "Rear small decal", metaKey: "autoMeta.rear", pills: ["pills.small"] }
  ],
  AUDI: [
    { title: "Windshield Banner (AUDI)", metaKey: "autoMeta.front", pills: ["pills.banner"] },
    { title: "Side quattro text", metaKey: "autoMeta.side", pills: ["pills.clean"] },
    { title: "Rear minimal text", metaKey: "autoMeta.rear", pills: ["pills.minimal"] }
  ],
  MERCEDES: [
    { title: "Windshield Banner (MB)", metaKey: "autoMeta.front", pills: ["pills.banner"] },
    { title: "Side AMG text", metaKey: "autoMeta.side", pills: ["pills.sport"] },
    { title: "Rear small tag", metaKey: "autoMeta.rear", pills: ["pills.small"] }
  ],
  OTHER: [
    { title: "Universal windshield text", metaKey: "autoMeta.front", pills: ["pills.universal"] },
    { title: "Universal side text", metaKey: "autoMeta.side", pills: ["pills.universal"] },
    { title: "Universal rear text", metaKey: "autoMeta.rear", pills: ["pills.universal"] }
  ]
};

const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}

function isBlackHex(hex) {
  const h = String(hex || "").trim().toLowerCase();
  return h === "#000" || h === "#000000" || h === "#0b0d10";
}

function setPreviewBoxContrast(previewTextEl, mainColorHex) {
  // When user selects black text, switch preview background to white for readability.
  const box = previewTextEl && previewTextEl.closest(".previewBox");
  if (!box) return;
  if (isBlackHex(mainColorHex)) {
    box.style.background = "#ffffff";
    box.style.borderColor = "rgba(0,0,0,.22)";
  } else {
    box.style.background = "";
    box.style.borderColor = "";
  }
}

// Font upload (TTF/OTF/WOFF/WOFF2) using the FontFace API.
// Persist uploaded fonts per-user (this browser) via IndexedDB.

const FONT_DB_NAME = "bg_stickers_fonts";
const FONT_DB_VERSION = 1;
const FONT_STORE = "fonts";

function openFontDB() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(FONT_DB_NAME, FONT_DB_VERSION);
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(FONT_STORE)) {
        db.createObjectStore(FONT_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

async function saveFontToDB(opts) {
  const db = await openFontDB();
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(FONT_STORE, "readwrite");
    tx.objectStore(FONT_STORE).put({
      id: opts.id,
      family: opts.family,
      fileName: opts.fileName,
      mime: opts.mime,
      buffer: opts.buffer,
      savedAt: Date.now()
    });
    tx.oncomplete = function () {
      resolve(true);
    };
    tx.onerror = function () {
      reject(tx.error);
    };
  });
}

async function loadAllFontsFromDB() {
  const db = await openFontDB();
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(FONT_STORE, "readonly");
    const req = tx.objectStore(FONT_STORE).getAll();
    req.onsuccess = function () {
      resolve(req.result || []);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

async function registerFontFaceFromBuffer(family, buffer, mime) {
  const blob = new Blob([buffer], { type: mime || "font/ttf" });
  const url = URL.createObjectURL(blob);
  const face = new FontFace(family, "url(" + url + ")");
  await face.load();
  document.fonts.add(face);
  // Note: keep the blob URL alive for the session. (Revoking it would break the font.)
  return true;
}

function _fontIdFromFile(file) {
  return file.name + "__" + file.size + "__" + file.lastModified;
}

function _hashStringDjb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function _sanitizeFontFamily(name) {
  return (
    String(name || "Custom Font")
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/[^a-zA-Z0-9À-ɏЀ-ӿ\s]/g, "")
      .trim() || "Custom Font"
  );
}

function _stableUserFontFamily(file) {
  const base = _sanitizeFontFamily(file && file.name);
  const id = _fontIdFromFile(file);
  const h = _hashStringDjb2(id);
  return "User: " + base + " (" + h + ")";
}

function _ensureUploadedOptgroup(selectEl) {
  if (!selectEl) return null;
  let g = selectEl.querySelector('optgroup[data-uploaded="1"]');
  if (g) return g;
  g = document.createElement("optgroup");
  g.label = window.t ? window.t("common.uploaded") : "Uploaded";
  g.setAttribute("data-uploaded", "1");
  selectEl.insertBefore(g, selectEl.firstChild);
  return g;
}

function _addFontOption(selectEl, family) {
  const g = _ensureUploadedOptgroup(selectEl);
  if (!g) return;
  const exists = Array.prototype.some.call(selectEl.options || [], function (o) {
    return (o.value || "") === family;
  });
  if (exists) return;
  const opt = document.createElement("option");
  opt.value = family;
  opt.textContent = family;
  g.appendChild(opt);
}

async function loadAndRegisterUserFont(file) {
  if (!file) return null;
  const family = _stableUserFontFamily(file);
  const buf = await file.arrayBuffer();
  await registerFontFaceFromBuffer(family, buf, file.type);
  return { family: family, buffer: buf };
}

async function bootstrapSavedFonts() {
  if (!("indexedDB" in window) || !("FontFace" in window) || !document.fonts) return;
  try {
    const saved = await loadAllFontsFromDB();
    if (!Array.isArray(saved) || !saved.length) return;
    for (const f of saved) {
      try {
        await registerFontFaceFromBuffer(f.family, f.buffer, f.mime);
        ["npFont", "stFont"].forEach(function (id) {
          _addFontOption($(id), f.family);
        });
      } catch (err) {
        console.warn("Failed to load saved font", f && f.family, err);
      }
    }
  } catch (err) {
    console.warn("Font DB bootstrap failed", err);
  }
}

function initFontUploads() {
  const inputs = [
    { inputId: "npFontUpload", selectId: "npFont", hintId: "npFontUploadHint", onUpdate: updateNadpisi },
    { inputId: "stFontUpload", selectId: "stFont", hintId: "stFontUploadHint", onUpdate: updateStikeri }
  ];

  inputs.forEach(function (cfg) {
    const inp = $(cfg.inputId);
    const sel = $(cfg.selectId);
    const hint = $(cfg.hintId);
    if (!inp || !sel) return;

    inp.addEventListener("change", async function () {
      const file = inp.files && inp.files[0];
      if (!file) return;

      if (!("FontFace" in window) || !document.fonts) {
        if (hint) hint.textContent = window.t ? window.t("common.browserNoFonts") : "This browser does not support loading fonts directly.";
        return;
      }

      const okTypes = [
        "font/ttf",
        "font/otf",
        "font/woff",
        "font/woff2",
        "application/font-woff",
        "application/font-woff2",
        "application/octet-stream"
      ];
      const extOk = /\.(ttf|otf|woff|woff2)$/i.test(file.name);
      if (!extOk && okTypes.indexOf(file.type) === -1) {
        if (hint) hint.textContent = window.t ? window.t("common.pleaseUploadFont") : "Please upload TTF/OTF/WOFF/WOFF2 file.";
        inp.value = "";
        return;
      }

      try {
        if (hint) hint.textContent = window.t ? window.t("common.fontUploading") : "Loading font…";
        const loaded = await loadAndRegisterUserFont(file);
        if (!loaded || !loaded.family) throw new Error("no family");
        const family = loaded.family;
        ["npFont", "stFont"].forEach(function (id) {
          _addFontOption($(id), family);
        });
        sel.value = family;

        if ("indexedDB" in window) {
          const id = _fontIdFromFile(file);
          await saveFontToDB({
            id: id,
            family: family,
            fileName: file.name,
            mime: file.type,
            buffer: loaded.buffer
          });
        }

        if (hint) hint.textContent = (window.t ? window.t("common.fontAdded") : "✅ Font added: ") + family;
        if (cfg.onUpdate) cfg.onUpdate();
      } catch (err) {
        console.error(err);
        if (hint) hint.textContent = window.t ? window.t("common.fontError") : "❌ Could not load this font. Try another file (woff2/ttf).";
      } finally {
        inp.value = "";
      }
    });
  });
}

function renderColorDock(colors) {
  const sw = $("swatches");
  if (!sw) return;
  sw.innerHTML = "";
  colors.forEach(function (c) {
    const el = document.createElement("div");
    el.className = "swatch";
    el.style.background = c.hex;
    el.dataset.tip = c.name + " • " + c.hex;
    sw.appendChild(el);
  });
}

function fillColorSelect(selectEl, colors) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  colors.forEach(function (c) {
    const opt = document.createElement("option");
    opt.value = c.hex;
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  });
  const y = colors.find(function (c) {
    return c.name.toLowerCase().indexOf("жъл") !== -1;
  });
  if (y) selectEl.value = y.hex;
}

function renderExtraColors(containerEl, hiddenEl, colors, summaryEl) {
  if (!containerEl || !hiddenEl) return;
  containerEl.innerHTML = "";

  colors.forEach(function (c) {
    const id = "x_" + Math.random().toString(16).slice(2);
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

    label.appendChild(cb);
    label.appendChild(dot);
    label.appendChild(txt);
    containerEl.appendChild(label);
  });

  const sync = function () {
    const chosen = Array.prototype.map.call(
      containerEl.querySelectorAll('input[type="checkbox"]:checked'),
      function (x) {
        return x.value;
      }
    );
    hiddenEl.value = chosen.join(",");
    if (summaryEl) {
      if (window.t) {
        summaryEl.textContent = chosen.length
          ? window.t("common.extraColorsSelected", { count: chosen.length })
          : window.t("common.selectExtraColors");
      } else {
        summaryEl.textContent = chosen.length
          ? "Extra colors: " + chosen.length + " selected"
          : "Select extra colors";
      }
    }
    return chosen;
  };
  containerEl.addEventListener("change", sync);
  sync();
}

function getExtraColors(hiddenEl) {
  const v = (hiddenEl && hiddenEl.value) || "";
  const trimmed = v.trim();
  if (!trimmed) return [];
  return trimmed
    .split(",")
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

// Live previews

function updateNadpisi() {
  const text = ($("npText") && $("npText").value) || "";
  const width = Number(($("npWidth") && $("npWidth").value) || 40);
  const font = ($("npFont") && $("npFont").value) || "Roboto";
  const mainColor = ($("npMainColor") && $("npMainColor").value) || "#ffd400";
  const extras = NP_MODE === "popular" ? [] : getExtraColors($("npExtraColorsHidden"));

  const readyImg = $("npReadyImg");
  const previewText = $("npPreviewText");
  if (NP_MODE === "popular" && NP_SELECTED_POPULAR && NP_SELECTED_POPULAR.image) {
    if (readyImg) {
      readyImg.src = NP_SELECTED_POPULAR.image;
      readyImg.style.display = "block";
    }
    if (previewText) previewText.style.display = "none";
  } else {
    if (readyImg) readyImg.style.display = "none";
    if (previewText) previewText.style.display = "block";
  }

  const p = previewText;
  if (p) {
    p.textContent = text || "";
    p.style.fontFamily = font + ", Roboto, Inter, Arial, Helvetica, sans-serif";
    p.style.color = mainColor;
    p.style.fontSize = Math.max(18, Math.min(72, width)) + "px";
    setPreviewBoxContrast(p, mainColor);
  }
  if ($("npRulerText")) {
    const cmText = window.t ? window.t("common.cm") : "cm";
    $("npRulerText").textContent = "~" + width + " " + cmText;
  }

  const est = estimatePrice({ widthCm: width, extraColorsCount: extras.length, extraBase: 0 });
  if ($("npPrice")) {
    if (window.t) {
      $("npPrice").textContent =
        est.total + "€ (" + window.t("common.base") + " " + est.base + "€ + " + est.extra + "€ " + window.t("common.for") + " " + extras.length + " " + window.t("common.additional") + ")";
    } else {
      $("npPrice").textContent =
        est.total + "€ (base " + est.base + "€ + " + est.extra + "€ for " + extras.length + " additional)";
    }
  }
}

function updateStikeri() {
  // Always work from the canonical designer state.
  // Some flows call updateStikeri() before the layer bar initializes.
  // In those cases, the state may still be null, which makes layers/background appear broken.
  const state = window.ST_DESIGN_STATE || (typeof window._ensureDesignerState === 'function' ? window._ensureDesignerState() : null);
  const mode = (($("designMode") && $("designMode").value) || "text").trim();
  // Do NOT trim: users must be able to type spaces naturally.
  const rawText = (($("stText") && $("stText").value) || "");
  const width = Number(($("stWidth") && $("stWidth").value) || 10);
  const qtyRaw = Number(($("stQty") && $("stQty").value) || 50);
  const qtyForPrice = Math.max(5, isFinite(qtyRaw) ? qtyRaw : 5);
  const font = ($("stFont") && $("stFont").value) || "Inter";
  const mainColor = ($("stMainColor") && $("stMainColor").value) || "#FFFFFF";
  // Preview background control:
  // - If user toggles White BG on/off, respect that.
  // - If an SVG upload layer is active and user has not explicitly disabled White BG, default to white.
  // - If text is very dark and no background is selected, auto-white for readability.
  (function(){
    try{
      const box = document.getElementById('stPreviewBox');
      if (!box) return;
      const bgSel = ($('stBackground') && $('stBackground').value) || 'none';
      const pref = (typeof window.__ST_PREVIEW_WHITE_BG_PREF__ === 'boolean') ? window.__ST_PREVIEW_WHITE_BG_PREF__ : null;

      // Luma check for dark text
      const hex = String(mainColor || '#FFFFFF').trim();
      const m = /^#?([0-9a-f]{6})$/i.exec(hex);
      let isDark = false;
      if (m) {
        const n = parseInt(m[1], 16);
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        const l = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
        isDark = l < 0.28;
      }

      // Active layer upload?
      // NOTE: Curated library assets are rendered as SVG images too, but we *don't*
      // want to auto-enable the white preview background for them, because we
      // also render assets as white by default. White-on-white makes the asset
      // appear "missing".
      let activeUpload = false;
      try {
        const st = window.ST_DESIGN_STATE;
        const a = st && st.activeKey ? String(st.activeKey) : 'sticker:0';
        if (st && a.startsWith('sticker:') && Array.isArray(st.stickerLayers)) {
          const idx = Number(a.split(':')[1] || 0);
          const layer = st.stickerLayers[idx];
          const isAsset = !!(layer && (layer.mode === 'assets' || layer.assetId));
          activeUpload = !!(layer && layer.mode === 'upload' && layer.imageUrl && !isAsset);
        } else {
          // fallback: current mode
          activeUpload = (mode === 'upload');
        }
      } catch(e) {}

      const autoForImg = activeUpload; // SVG-only uploads; show best on white by default
      const autoForDarkText = isDark && String(bgSel) === 'none';
      const shouldWhite = (pref === true) || (pref === null && autoForImg) || autoForDarkText;
      box.classList.toggle('whiteBgOn', !!shouldWhite);
    } catch(e) {}
  })();


  const finish = ($("stFinish") && $("stFinish").value) || "matte";
  const bg = ($("stBackground") && $("stBackground").value) || "none";
  const bgColor = ($("stBgColor") && $("stBgColor").value) || "#FFFFFF";
  const bgScaleX = Number(($("stBgScaleX") && $("stBgScaleX").value) || 110);
  const bgScaleY = Number(($("stBgScaleY") && $("stBgScaleY").value) || 110);
  const bgFinish = ($("stBgFinish") && $("stBgFinish").value) || "matte";
  // Strict text rules: keep raw input, render based on per-layer flow.
  const flow = (($("stTextFlow") && $("stTextFlow").value) || "single").trim();
  const ruleHint = $("stTextRuleHint");
  const renderedText = (mode === "text") ? stApplyTextRules(rawText, flow, ruleHint) : "";

  // Persist into the active sticker layer (even if the activeKey isn't a sticker, we apply to layer 0).
  if (state) {
    if (!Array.isArray(state.stickerLayers)) state.stickerLayers = [];
    // ensure at least one sticker layer exists
    if (!state.stickerLayers.length) state.stickerLayers.push({ mode: "text", textRaw: "", textFlow: "single", text: "" });

    let idx = 0;
    if (state.activeKey && String(state.activeKey).startsWith("sticker:")) {
      idx = Number(String(state.activeKey).split(":")[1] || 0) || 0;
    }
    if (!state.stickerLayers[idx]) state.stickerLayers[idx] = { mode: "text", textRaw: "", textFlow: "single", text: "" };

    if (mode === "text") {
      state.stickerLayers[idx].mode = "text";
      state.stickerLayers[idx].textRaw = rawText;
      state.stickerLayers[idx].textFlow = (flow === "words") ? "words" : "single";
      state.stickerLayers[idx].text = renderedText; // compatibility
    } else {
      // Preserve exact non-text mode: upload or assets.
      state.stickerLayers[idx].mode = (mode === "assets") ? "assets" : "upload";
      // keep textRaw/textFlow as-is; image layers ignore text
    }
  }

  // Multi-layer live preview.

  const layersWrap = $("stLayersPreview");
  if (layersWrap) {
    layersWrap.innerHTML = "";
    const stickerLayers = (state && Array.isArray(state.stickerLayers) && state.stickerLayers.length)
      ? state.stickerLayers
      : [{ mode: mode, textRaw: rawText, textFlow: (flow==="words"?"words":"single"), text: renderedText, font: font, color: mainColor, imageUrl: ($("stThumb") && $("stThumb").src) || "" }];

    const activeKey = state ? state.activeKey : "sticker:0";
    const baseFontSizePx = Math.max(18, Math.min(64, width * 3.6));

    stickerLayers.forEach(function (layer, idx) {
      const key = "sticker:" + idx;
      const el = document.createElement("div");
      el.className = "layerEl";
      el.dataset.key = key;
      el.style.zIndex = String(10 + idx);
      if (activeKey === key) {
        el.style.outline = "1px solid rgba(139,92,246,.55)";
        el.style.outlineOffset = "10px";
        el.style.borderRadius = "18px";
      }

      // Render rule:
      // - If an imageUrl exists, render it (even if the mode flag got out of sync).
      //   This prevents "upload succeeded but nothing shows" states.
      // - Otherwise, render text when present.
      const lmode = (layer && layer.mode) || "text";
      const hasImg = !!(layer && layer.imageUrl);
      if (hasImg) {
        const img = document.createElement("img");
        img.alt = "layer";
        img.src = layer.imageUrl;
        img.className = "layerElImg";
        const layerW = isFinite(Number(layer && layer.widthCm)) ? Number(layer.widthCm) : width;
        img.style.width = Math.max(40, Math.min(900, layerW * 12)) + "px";
        // Curated assets should default to white (monochrome) for best contrast.
        try {
          const isAsset = ((layer && layer.mode) === "assets") || !!(layer && layer.assetId);
          // Curated assets are usually black SVGs; make them visible on the dark designer preview.
          if (layer && layer.isSvg && isAsset) img.classList.add("assetWhite");
        } catch(e) {}
        // Per-layer transform (translation + rotation) is applied on the wrapper element (el).
        el.appendChild(img);
      } else {
        const txt = stApplyTextRules((layer && (layer.textRaw ?? layer.text)) || "", (layer && layer.textFlow) || "single");
        if (txt) {
          const tEl = document.createElement("div");
          tEl.className = "layerElText";
          tEl.textContent = txt;
          tEl.style.fontFamily = ((layer && layer.font) || font) + ", Roboto, Inter, Arial, Helvetica, sans-serif";
          tEl.style.color = (layer && layer.color) || mainColor;
          const layerW = isFinite(Number(layer && layer.widthCm)) ? Number(layer.widthCm) : width;
          tEl.style.fontSize = Math.max(12, Math.min(96, layerW * 3.6)) + "px";
          // Text-flow behavior:
          // - single: never wrap; allow horizontal scroll in preview
          // - words: allow line breaks (one word per line)
          const tf = (layer && layer.textFlow) || "single";
          tEl.style.whiteSpace = (tf === "words") ? "pre-line" : "nowrap";
          tEl.style.display = "inline-block";
          // Subtle finish hint (preview-only).
          tEl.style.textShadow = finish === "glossy" ? "0 1px 10px rgba(255,255,255,.10)" : "none";
          el.appendChild(tEl);
        }
        // If the layer is empty (no text and no image), render nothing.
        // (User requested no placeholder inside the preview.)
      }

      // Apply per-layer translation and rotation on the wrapper so it affects both text and images.
      try {
        const ox = isFinite(Number(layer && layer.offsetX)) ? Number(layer.offsetX) : 0;
        const oy = isFinite(Number(layer && layer.offsetY)) ? Number(layer.offsetY) : 0;
        const rot = isFinite(Number(layer && layer.rotationDeg)) ? Number(layer.rotationDeg) : 0;
                const sc = isFinite(Number(layer && layer.scale)) ? Number(layer.scale) : 1;
        el.style.transform = `translate(-50%, -50%) translate(${ox}px, ${oy}px) rotate(${rot}deg) scale(${sc})`;
        el.style.transformOrigin = "50% 50%";
      } catch (e) {}

      layersWrap.appendChild(el);
    });
  }
  if ($("stRulerText")) {
    const cmText = window.t ? window.t("common.cm") : "cm";
    $("stRulerText").textContent = "~" + width + " " + cmText;
  }

  // Background options visibility
  const bgOpts = $("stBgOptions");
  if (bgOpts) bgOpts.style.display = bg && bg !== "none" ? "" : "none";

  // Background preview behind content
  const bgEl = $("stBgPreview");
  if (bgEl) {
    const on = bg && bg !== "none";
    bgEl.style.display = on ? "block" : "none";
    // Highlight when background layer is active.
    if (state && state.activeKey === "background" && on) {
      bgEl.style.outline = "1px solid rgba(139,92,246,.55)";
      bgEl.style.outlineOffset = "10px";
    } else {
      bgEl.style.outline = "none";
      bgEl.style.outlineOffset = "0";
    }
    // Background is always a filled shape (no triangle option).
    bgEl.style.background = bgColor;

    // Size is user-chosen %, but the base size should hug the current design (text/img).
    // This prevents "huge" backgrounds when the user selects a background option.
    // Keep scaling subtle and predictable; background already auto-hugs content.
    const pctX = Math.max(70, Math.min(160, isFinite(bgScaleX) ? bgScaleX : 110));
    const pctY = Math.max(70, Math.min(160, isFinite(bgScaleY) ? bgScaleY : 110));

    // Fallback base size (used when we can't measure the content yet).
    let wpx = 360;
    let hpx = 220;
    if (bg === "square" || bg === "rounded-square" || bg === "circle") {
      wpx = 300;
      hpx = 300;
    } else if (bg === "rect" || bg === "rounded-rect") {
      wpx = 420;
      hpx = 240;
    }
    bgEl.style.width = Math.round(wpx) + "px";
    bgEl.style.height = Math.round(hpx) + "px";
    bgEl.style.transform = "translate(-50%,-50%) scaleX(" + (pctX / 100) + ") scaleY(" + (pctY / 100) + ")";
    // Finish hint (preview-only)
    bgEl.style.boxShadow = bgFinish === "glossy" ? "0 0 0 1px rgba(255,255,255,.08), 0 10px 30px rgba(0,0,0,.35)" : "0 0 0 1px rgba(255,255,255,.08)";

    // Shape mapping
    bgEl.className = "bgPreview"; // reset
    if (on) bgEl.classList.add("bg-" + bg);

    // After layout, measure the actual design bounds and auto-size the background around it.
    // IMPORTANT: Users expect the background size to stay stable during actions like:
    // - toggling preview grid/white background
    // - switching active layer
    // - moving / rotating / scaling layers
    // Therefore we "auto-fit" ONLY when the *content* changes (text/image/background type),
    // not when transforms/selection change.
    if (on) {
      requestAnimationFrame(function(){
        try {
          const layersWrap = document.getElementById('stLayersPreview');
          if (!layersWrap) return;
          // Auto-fit should hug the *actual design content*.
          // IMPORTANT: Do NOT derive content from DOM presence alone.
          // Some UI actions (e.g. switching to the Background layer) may temporarily rebuild/hide
          // layer preview DOM nodes, which would make the background recompute based on a subset
          // of layers and "shrink" unexpectedly.
          // We therefore:
          // 1) determine non-empty layers from *state*
          // 2) only update background size if we can measure *all* those layers in the DOM
          const nonEmptyLayerIdx = [];
          if (state && Array.isArray(state.stickerLayers)) {
            state.stickerLayers.forEach(function(layer, idx){
              const hasImg = !!(layer && layer.imageUrl);
              const txt = stApplyTextRules(((layer && (layer.textRaw ?? layer.text)) || ''), ((layer && layer.textFlow) || 'single'));
              const hasTxt = !!String(txt || '').trim();
              if (hasImg || hasTxt) nonEmptyLayerIdx.push(idx);
            });
          }

          // Collect DOM elements for those indices (may be missing during some UI states).
          const els = [];
          const allLayerEls = Array.from(layersWrap.querySelectorAll('.layerEl'));
          nonEmptyLayerIdx.forEach(function(idx){
            const wantedKey = 'sticker:' + String(idx);
            const el = allLayerEls.find(function(e){
              const k = e && e.dataset ? String(e.dataset.key || '') : '';
              return k === wantedKey;
            });
            if (el) els.push(el);
          });
          // If there is nothing to measure (e.g., user is on a brand-new empty layer),
          // keep the last size instead of shrinking.
          if (!nonEmptyLayerIdx.length) return;

          // If we can't measure all non-empty layers right now (DOM not ready / hidden),
          // keep the last stable background size.
          if (els.length !== nonEmptyLayerIdx.length) {
            if (state && isFinite(Number(state._bgBaseW)) && isFinite(Number(state._bgBaseH))) {
              bgEl.style.width = Math.round(Number(state._bgBaseW)) + 'px';
              bgEl.style.height = Math.round(Number(state._bgBaseH)) + 'px';
              bgEl.style.transform = "translate(-50%,-50%) scaleX(" + (pctX / 100) + ") scaleY(" + (pctY / 100) + ")";
            }
            return;
          }

          // Build a "content signature" that ignores position/rotation/scale.
          // This prevents background size changes during transforms and layer switching.
          const sig = (function(){
            if (!state || !Array.isArray(state.stickerLayers)) return '';
            const parts = [];
            nonEmptyLayerIdx.forEach(function(idx){
              const layer = state.stickerLayers[idx] || {};
              const hasImg = !!layer.imageUrl;
              const txt = stApplyTextRules((layer.textRaw ?? layer.text) || '', (layer.textFlow) || 'single');
              const t = String(txt || '').trim();
              // include key style inputs that change intrinsic size
              const h = isFinite(Number(layer.heightCm)) ? Number(layer.heightCm) : '';
              const font = String(layer.font || '');
              const bold = !!layer.bold;
              const italic = !!layer.italic;
              const stroke = isFinite(Number(layer.strokePx)) ? Number(layer.strokePx) : '';
              parts.push([
                idx,
                hasImg ? ('img:' + String(layer.imageUrl)) : ('txt:' + t),
                'w:' + (isFinite(Number(layer.widthCm)) ? Number(layer.widthCm) : ''),
                'h:' + h,
                'f:' + font,
                'b:' + (bold?1:0),
                'i:' + (italic?1:0),
                's:' + stroke
              ].join(','));
            });
            // Background shape influences shape-aware adjustments.
            parts.push('bg:' + String(bg));
            return parts.join('|');
          })();

          // If content hasn't changed, keep the previously computed base size.
          // (We still apply user scale % transforms above.)
          if (state) {
            if (state._bgLastSig === sig && isFinite(Number(state._bgBaseW)) && isFinite(Number(state._bgBaseH))) {
              bgEl.style.width = Math.round(Number(state._bgBaseW)) + 'px';
              bgEl.style.height = Math.round(Number(state._bgBaseH)) + 'px';
              bgEl.style.transform = "translate(-50%,-50%) scaleX(" + (pctX / 100) + ") scaleY(" + (pctY / 100) + ")";
              return;
            }
          }
          let minL=Infinity, minT=Infinity, maxR=-Infinity, maxB=-Infinity;
          let measured = 0;
          els.forEach(function(el){
            // Measure the *actual content* (text node or img), not the wrapper.
            // This avoids huge bounds caused by flex/wrappers.
            const content = el.querySelector('.layerElText') || el.querySelector('img') || el;
            const r = content.getBoundingClientRect();
            if (!r || !isFinite(r.left)) return;
            // Ignore elements that are currently not rendered/visible.
            // This prevents background shrinking when switching layers and some previews
            // are temporarily display:none or have 0x0 rects.
            if ((r.width || 0) < 2 || (r.height || 0) < 2) return;
            minL = Math.min(minL, r.left);
            minT = Math.min(minT, r.top);
            maxR = Math.max(maxR, r.right);
            maxB = Math.max(maxB, r.bottom);
            measured++;
          });
          if (measured !== els.length) {
            // If some elements couldn't be measured, keep last stable size.
            if (state && isFinite(Number(state._bgBaseW)) && isFinite(Number(state._bgBaseH))) {
              bgEl.style.width = Math.round(Number(state._bgBaseW)) + 'px';
              bgEl.style.height = Math.round(Number(state._bgBaseH)) + 'px';
              bgEl.style.transform = "translate(-50%,-50%) scaleX(" + (pctX / 100) + ") scaleY(" + (pctY / 100) + ")";
            }
            return;
          }
          if (!isFinite(minL) || !isFinite(maxR)) return;
          const bw = Math.max(40, maxR - minL);
          const bh = Math.max(40, maxB - minT);
          const pad = 36; // padding around content
          let baseW = bw + pad * 2;
          let baseH = bh + pad * 2;
          // Shape-aware adjustments
          if (bg === 'circle') {
            const s = Math.max(baseW, baseH);
            baseW = s; baseH = s;
          } else if (bg === 'square' || bg === 'rounded-square') {
            const s = Math.max(baseW, baseH);
            baseW = s; baseH = s;
          }
          // Clamp so it stays "hugged" around the design.
          baseW = Math.max(160, Math.min(900, baseW));
          baseH = Math.max(120, Math.min(520, baseH));
          bgEl.style.width = Math.round(baseW) + 'px';
          bgEl.style.height = Math.round(baseH) + 'px';
          bgEl.style.transform = "translate(-50%,-50%) scaleX(" + (pctX / 100) + ") scaleY(" + (pctY / 100) + ")";

          // Cache computed base size for stability across transforms.
          if (state) {
            state._bgLastSig = sig;
            state._bgBaseW = baseW;
            state._bgBaseH = baseH;
          }
        } catch(e) {}
      });
    }
  }

  // Quantity hint + pricing clamp
  const qtyHint = $("stQtyHint");
  if (qtyHint) {
    qtyHint.textContent = qtyRaw > 0 && qtyRaw < 5 ? "Price will be calculated as 5 pcs (minimum)." : "";
  }

  // Simple estimate: base by size + finish + quantity.
  const extraStickerLayers = state && Array.isArray(state.stickerLayers) ? Math.max(0, state.stickerLayers.length - 1) : 0;
  const est = estimateStickerDesignerPrice({
    widthCm: width,
    qty: qtyForPrice,
    finish: finish,
    background: bg,
    backgroundFinish: bgFinish,
    extraStickerLayers: extraStickerLayers
  });
  const total = (typeof est.total === "number" ? est.total : Number(est.total || 0));
  if ($("stPrice")) {
    const totalTxt = isFinite(total) ? total.toFixed(2) : String(total);
    const unitTxt = typeof est.unit === "number" ? est.unit.toFixed(2) : String(est.unit);
    $("stPrice").textContent = totalTxt + "€ (" + unitTxt + "€/pc @ " + qtyForPrice + ")";
  }
}

function setNadpisiMode(mode, popularItem) {
  NP_MODE = mode === "popular" ? "popular" : "custom";
  NP_SELECTED_POPULAR = NP_MODE === "popular" ? popularItem || null : null;

  const notice = $("npPopularNotice");
  const noticeTitle = $("npPopularTitle");
  const hiddenPreset = $("npPopularPreset");

  const hideIds = ["npText", "npHeight", "npFont", "npExtraColors"];
  hideIds.forEach(function (id) {
    const el = $(id);
    const wrap =
      (el && el.closest("label")) ||
      (el && el.closest(".colorMulti") && el.closest(".colorMulti").closest("label"));
    if (!wrap) return;
    wrap.style.display = NP_MODE === "popular" ? "none" : "";
  });

  ["npText", "npHeight", "npFont"].forEach(function (id) {
    const el = $(id);
    if (el) el.disabled = NP_MODE === "popular";
  });
  const extraHidden = $("npExtraColorsHidden");
  if (NP_MODE === "popular" && extraHidden) extraHidden.value = "";

  if (NP_MODE === "popular") {
    if (notice) notice.style.display = "block";
    if (noticeTitle) {
      const readyText = window.t ? window.t("common.readyText") : "Ready text";
      noticeTitle.textContent = (popularItem && popularItem.title) || readyText;
    }
    if (hiddenPreset)
      hiddenPreset.value =
        (popularItem && (popularItem.id || popularItem.title)) || "";

    const txt = $("npText");
    if (txt) {
      txt.required = false;
      txt.value = (popularItem && popularItem.preset && popularItem.preset.text) || "";
    }
    if (popularItem && popularItem.preset && popularItem.preset.width) {
      $("npWidth").value = popularItem.preset.width;
    }
  } else {
    if (notice) notice.style.display = "none";
    if (hiddenPreset) hiddenPreset.value = "";
    const txt = $("npText");
    if (txt) txt.required = true;
  }

  updateNadpisi();
}

// Tabs

function initTabs() {
  document.querySelectorAll(".tabBtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const page = btn.closest(".page");
      if (!page) return;
      page.querySelectorAll(".tabBtn").forEach(function (b) {
        b.classList.remove("active");
      });
      page.querySelectorAll(".tabPanel").forEach(function (p) {
        p.classList.remove("active");
      });
      btn.classList.add("active");
      const targetId =
        btn.dataset.tab === "nadpisi-pop" ? "tab-nadpisi-pop" : "tab-nadpisi-custom";
      const target = document.getElementById(targetId);
      if (target) target.classList.add("active");
    });
  });
}

// Popular cards

function renderPopular(gridEl, items, onRequest) {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  items.forEach(function (it) {
    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML =
      "\n      " +
      (it.image
        ? '<div class="itemImgWrap"><img class="itemImg" src="' +
          escapeHtml(it.image) +
          '" alt=""></div>'
        : "") +
      '\n      <div class="itemTitle">' +
      escapeHtml(it.title) +
      "</div>\n      <div class=\"itemMeta\">" +
      escapeHtml((it.metaKey && window.t ? window.t(it.metaKey) : it.meta) || "") +
      '</div>\n      <div class="itemPillRow">' +
      ((it.pills || [])
        .map(function (p) {
          const pillText = (p.indexOf("pills.") === 0 && window.t) ? window.t(p) : p;
          return '<span class="pill">' + escapeHtml(pillText) + "</span>";
        })
        .join("")) +
      "</div>\n      " +
      (onRequest
        ? '<div class="itemActions"><button class="btn btnPrimary">' + (window.t ? window.t("nadpisi.tabs.custom") : "CUSTOM") + '</button></div>'
        : "") +
      "\n    ";
    if (onRequest) {
      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", function () {
          onRequest(it);
        });
      }
    }
    gridEl.appendChild(card);
  });
}

function renderNadpisiPopular() {
  renderPopular(document.getElementById("nadpisiPopularGrid"), POPULAR_TEXTS, function (it) {
    location.hash = "#nadpisi";
    setTimeout(function () {
      const tabBtn = document.querySelector('[data-tab="nadpisi-custom"]');
      if (tabBtn) tabBtn.click();
      setNadpisiMode("popular", it);
    }, 60);
  });
}

function initBrandDropdown() {
  const sel = document.getElementById("brandSelect");
  if (!sel) return;
  sel.innerHTML = "";
  Object.keys(AUTO_BY_BRAND).forEach(function (b) {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b === "OTHER" ? (window.t ? window.t("avto.custom") : "OTHER") : b;
    sel.appendChild(opt);
  });
  sel.value = "BMW";
  const render = function () {
    renderPopular(
      document.getElementById("avtoPopularGrid"),
      AUTO_BY_BRAND[sel.value] || AUTO_BY_BRAND["OTHER"],
      null
    );
  };
  sel.addEventListener("change", render);
  render();
}

// Gallery

async function initGallery() {
  const grid = document.getElementById("galleryGrid");
  const tagSel = document.getElementById("galleryTag");
  if (!grid || !tagSel) return;

  const data = await safeFetchJson("gallery.json");
  const items = Array.isArray(data) ? data : [];
  const tags = new Set();
  items.forEach(function (x) {
    (x.tags || []).forEach(function (t) {
      tags.add(String(t).toLowerCase());
    });
  });
  const allText = window.t ? window.t("gallery.all") : "All";
  tagSel.innerHTML = '<option value="all">' + allText + '</option>';
  Array.from(tags)
    .sort()
    .forEach(function (t) {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      tagSel.appendChild(opt);
    });

  const render = function () {
    const selVal = tagSel.value;
    const filtered =
      selVal === "all"
        ? items
        : items.filter(function (x) {
            return (x.tags || [])
              .map(function (t) {
                return String(t).toLowerCase();
              })
              .includes(selVal);
          });
    grid.innerHTML = "";
    if (!filtered.length) {
      const noProjectsText = window.t ? window.t("gallery.noProjects") : "No projects (add to gallery.json).";
      grid.innerHTML = '<div class="muted small">' + noProjectsText + '</div>';
      return;
    }
    filtered.forEach(function (item) {
      const card = document.createElement("div");
      card.className = "galleryItem";
      const hasImg = item.image && String(item.image).trim();
      card.innerHTML =
        "\n        " +
        (hasImg
          ? '<img class="galleryImg" src="' +
            escapeHtml(item.image) +
            '" alt="">'
          : '<div class="galleryPh"></div>') +
        '\n        <div class="galleryCap">' +
        escapeHtml(item.title || "") +
        '</div>\n        <div class="gallerySub">' +
        escapeHtml(item.caption || "") +
        "</div>\n      ";
      grid.appendChild(card);
    });
  };

  tagSel.addEventListener("change", render);
  render();
}

// Update dynamic translations (called when language changes)
function updateDynamicTranslations() {
  // Re-render popular items
  renderNadpisiPopular();
  // Re-render auto popular if brand dropdown exists
  const brandSel = document.getElementById("brandSelect");
  if (brandSel && brandSel.value) {
    renderPopular(
      document.getElementById("avtoPopularGrid"),
      AUTO_BY_BRAND[brandSel.value] || AUTO_BY_BRAND["OTHER"],
      null
    );
  }
  // Re-render gallery
  initGallery();
  // Update font optgroup labels
  ["npFont", "stFont"].forEach(function (id) {
    const sel = document.getElementById(id);
    if (sel) {
      const uploadedGroup = sel.querySelector('optgroup[data-uploaded="1"]');
      if (uploadedGroup) {
        uploadedGroup.label = window.t ? window.t("common.uploaded") : "Uploaded";
      }
      const popularGroup = sel.querySelector('optgroup[data-i18n-label="common.popular"]');
      if (popularGroup) {
        popularGroup.label = window.t ? window.t("common.popular") : "Popular";
      }
      const classicGroup = sel.querySelector('optgroup[data-i18n-label="common.classic"]');
      if (classicGroup) {
        classicGroup.label = window.t ? window.t("common.classic") : "Classic (system)";
      }
      const coolerGroup = sel.querySelector('optgroup[data-i18n-label="common.cooler"]');
      if (coolerGroup) {
        coolerGroup.label = window.t ? window.t("common.cooler") : "Cooler (Google)";
      }
    }
  });
  // Update price displays
  updateNadpisi();
  updateStikeri();
  // Update extra colors summary
  const stExtraSummary = document.getElementById("stExtraColorsSummary");
  if (stExtraSummary) {
    const hidden = document.getElementById("stExtraColorsHidden");
    if (hidden) {
      const extras = getExtraColors(hidden);
      if (window.t) {
        stExtraSummary.textContent = extras.length
          ? window.t("common.extraColorsSelected", { count: extras.length })
          : window.t("common.selectExtraColors");
      } else {
        stExtraSummary.textContent = extras.length
          ? "Extra colors: " + extras.length + " selected"
          : "Select extra colors";
      }
    }
  }
}

// Expose functions globally
window.stApplyTextRules = stApplyTextRules;
window.updateDynamicTranslations = updateDynamicTranslations;

