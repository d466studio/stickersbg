// Checkout helpers: clipboard summaries + optional form submit.

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function buildNadpisiSummary() {
  const text = (document.getElementById("npText") && document.getElementById("npText").value) || "";
  const w = (document.getElementById("npWidth") && document.getElementById("npWidth").value) || "";
  const h = (document.getElementById("npHeight") && document.getElementById("npHeight").value) || "";
  const font = (document.getElementById("npFont") && document.getElementById("npFont").value) || "";
  const main =
    (document.getElementById("npMainColor") && document.getElementById("npMainColor").value) || "";
  const extras = getExtraColors(document.getElementById("npExtraColorsHidden"));
  const noteEl = document.querySelector('#formNadpisi textarea[name="note"]');
  const note = (noteEl && noteEl.value) || "";
  const price = (document.getElementById("npPrice") && document.getElementById("npPrice").textContent) || "";
  const t = window.t || function(s) { return s; };
  const cmText = t("common.cm");
  return (
    (t("summary.nadpisi") || "stickers.studio • TEXT ORDER") + "\n" +
    (t("summary.text") || "Text: ") +
    text +
    "\n" +
    (t("summary.size") || "Size: ") +
    w + cmText + " " +
    (h ? "/ " + h + cmText : "") +
    "\n" +
    (t("summary.font") || "Font: ") +
    font +
    "\n" +
    (t("summary.mainColor") || "Main color: ") +
    main +
    "\n" +
    (t("summary.extraColors") || "Extra colors: ") +
    (extras.join(", ") || (t("summary.none") || "none")) +
    "\n" +
    (t("summary.note") || "Note: ") +
    (note || "-") +
    "\n" +
    (t("summary.price") || "Price (est.): ") +
    price
  );
}

function buildStikeriSummary() {
  const mode = (document.getElementById("designMode") && document.getElementById("designMode").value) || "text";
  const text = (document.getElementById("stText") && document.getElementById("stText").value) || "";
  const w = (document.getElementById("stWidth") && document.getElementById("stWidth").value) || "";
  const qty = (document.getElementById("stQty") && document.getElementById("stQty").value) || "";
  const font = (document.getElementById("stFont") && document.getElementById("stFont").value) || "";
  const main =
    (document.getElementById("stMainColor") && document.getElementById("stMainColor").value) || "";
  const bg = (document.getElementById("stBackground") && document.getElementById("stBackground").value) || "none";
  const bgColor = (document.getElementById("stBgColor") && document.getElementById("stBgColor").value) || "";
  const bgScaleX = (document.getElementById("stBgScaleX") && document.getElementById("stBgScaleX").value) || "";
  const bgScaleY = (document.getElementById("stBgScaleY") && document.getElementById("stBgScaleY").value) || "";
  const bgFinish = (document.getElementById("stBgFinish") && document.getElementById("stBgFinish").value) || "";
  const finish = (document.getElementById("stFinish") && document.getElementById("stFinish").value) || "";
  const descEl = document.querySelector('#formStikeri textarea[name="description"]');
  const desc = (descEl && descEl.value) || "";
  const price = (document.getElementById("stPrice") && document.getElementById("stPrice").textContent) || "";

  const t = window.t || function(s) { return s; };
  const cmText = t("common.cm");
  let layerLines = "";
  try {
    const st = window.ST_DESIGN_STATE;
    if (st && Array.isArray(st.stickerLayers)) {
      layerLines = st.stickerLayers.map(function(l, i){
        return "Layer " + (i+1) + ": " +
          "mode=" + (l.mode || "text") +
          ", text=" + (l.mode === "text" ? JSON.stringify(l.textRaw || l.text || "") : "-") +
          ", asset=" + (l.assetId || "-") +
          ", font=" + (l.font || "-") +
          ", color=" + (l.color || "-") +
          ", layerWidthCm=" + (isFinite(Number(l.widthCm)) ? Number(l.widthCm) : "-") +
          ", rotation=" + (isFinite(Number(l.rotationDeg)) ? Number(l.rotationDeg) : 0) + "deg" +
          ", scale=" + (isFinite(Number(l.scale)) ? Number(l.scale) : 1);
      }).join("\n");
    }
  } catch(e) {}

  return (
    (t("summary.stikeri") || "stickers.studio • STICKER DESIGN ORDER") + "\n" +
    (t("summary.mode") || "Mode: ") +
    mode +
    "\n" +
    (t("summary.text") || "Text: ") +
    (mode === "text" ? (text || "-") : "(uploaded)") +
    "\n" +
    (t("summary.size") || "Size: ") +
    w + cmText + "\n" +
    (t("summary.quantity") || "Quantity: ") +
    qty + "\n" +
    (t("summary.font") || "Font: ") +
    font + "\n" +
    (t("summary.mainColor") || "Color: ") +
    main + "\n" +
    (t("summary.background") || "Background: ") +
    bg + "\n" +
    (bg && bg !== "none" ? ((t("summary.backgroundDetails") || "Background details: ") + bgColor + ", " + bgScaleX + "% x " + bgScaleY + "%, " + bgFinish + "\n") : "") +
    (t("summary.finish") || "Finish: ") +
    finish + "\n" +
    "Layers/settings:\n" + (layerLines || "-") + "\n" +
    (t("summary.description") || "Notes: ") +
    (desc || "-") + "\n" +
    (t("summary.price") || "Price (est.): ") +
    price
  );
}


async function buildDesignerSvgFile() {
  try {
    const st = window.ST_DESIGN_STATE || null;
    if (!st || !Array.isArray(st.stickerLayers)) return null;
    const wholeW = Number((document.getElementById("stWidth") && document.getElementById("stWidth").value) || 10);
    const pxW = Math.max(400, Math.min(2400, (isFinite(wholeW) ? wholeW : 10) * 30));
    const pxH = Math.round(pxW * 0.62);
    const esc = function(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]; }); };
    const toDataUrl = function(txt){
      try { return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(String(txt || '')))); }
      catch(e) { return ''; }
    };
    const getSvgHref = async function(l){
      if (!l) return '';
      if (l.svgText) return toDataUrl(l.svgText);
      const u = String(l.imageUrl || '');
      if (!u) return '';
      if (/^data:/i.test(u)) return u;
      if (/^blob:/i.test(u)) return '';
      try { const r = await fetch(u); if (r.ok) return toDataUrl(await r.text()); } catch(e) {}
      return u;
    };
    const applyRules = window.stApplyTextRules || function(raw){ return String(raw || ''); };
    const bg = (document.getElementById("stBackground") && document.getElementById("stBackground").value) || "none";
    const bgColor = (document.getElementById("stBgColor") && document.getElementById("stBgColor").value) || "#ffffff";
    let body = '';
    if (bg !== 'none') {
      const bw = pxW * (Number((document.getElementById("stBgScaleX") && document.getElementById("stBgScaleX").value) || 110) / 140);
      const bh = pxH * (Number((document.getElementById("stBgScaleY") && document.getElementById("stBgScaleY").value) || 110) / 160);
      const x = (pxW - bw) / 2, y = (pxH - bh) / 2;
      if (bg === 'circle') body += '<ellipse cx="'+(pxW/2)+'" cy="'+(pxH/2)+'" rx="'+(Math.min(bw,bh)/2)+'" ry="'+(Math.min(bw,bh)/2)+'" fill="'+esc(bgColor)+'"/>';
      else body += '<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+bh+'" rx="'+(bg.indexOf('rounded')>=0?28:0)+'" fill="'+esc(bgColor)+'"/>';
    }
    for (let i = 0; i < st.stickerLayers.length; i++) {
      const l = st.stickerLayers[i];
      const cx = pxW/2 + (Number(l.offsetX)||0), cy = pxH/2 + (Number(l.offsetY)||0);
      const rot = Number(l.rotationDeg)||0, sc = Number(l.scale)||1;
      const layerW = Math.max(40, Math.min(900, (Number(l.widthCm)||10) * 12));
      body += '<g transform="translate('+cx+' '+cy+') rotate('+rot+') scale('+sc+')">';
      if (l.imageUrl) {
        const href = await getSvgHref(l);
        body += '<image href="'+esc(href)+'" x="'+(-layerW/2)+'" y="'+(-layerW/4)+'" width="'+layerW+'" height="'+(layerW/2)+'" preserveAspectRatio="xMidYMid meet"/>';
      } else {
        const txt = applyRules((l.textRaw != null ? l.textRaw : l.text) || '', l.textFlow || 'single');
        if (String(txt).trim()) {
          const lines = String(txt).split(/\r?\n/);
          const fontSize = Math.max(12, Math.min(96, (Number(l.widthCm)||10) * 3.6));
          const y0 = -((lines.length-1) * fontSize * 0.55);
          lines.forEach(function(line, n){
            body += '<text x="0" y="'+(y0+n*fontSize*1.08)+'" dominant-baseline="middle" text-anchor="middle" font-family="'+esc(l.font||'Inter')+'" font-size="'+fontSize+'" font-weight="800" fill="'+esc(l.color||'#ffffff')+'">'+esc(line)+'</text>';
          });
        }
      }
      body += '</g>';
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+pxW+'" height="'+pxH+'" viewBox="0 0 '+pxW+' '+pxH+'">'+body+'</svg>';
    return new File([new Blob([svg], {type:'image/svg+xml'})], 'stickers-studio-design.svg', {type:'image/svg+xml'});
  } catch(e) { return null; }
}

// Optional submit
async function postForm(formEl, hintEl, extra) {
  const t = window.t || function(s) { return s; };
  if (!CONFIG.formEndpoint) {
    hintEl.textContent =
      (t("common.noEndpoint") || "⚠️ No formEndpoint. Add endpoint in app.js. Meanwhile: ") +
      CONFIG.instagram +
      " / " +
      CONFIG.contactEmail +
      ".";
    return;
  }
  hintEl.textContent = t("common.sending") || "Sending...";
  const fd = new FormData(formEl);
  Object.entries(extra || {}).forEach(function (entry) {
    fd.append(entry[0], entry[1]);
  });
  fd.append("_subject", "New stickers.studio order");
  fd.append("_captcha", "false");
  if (formEl && formEl.id === "formStikeri") {
    fd.append("order_summary", buildStikeriSummary());
    fd.append("designer_settings_text", buildStikeriSummary());
    const designFile = await buildDesignerSvgFile();
    if (designFile) fd.append("final_design_svg", designFile, "stickers-studio-design.svg");
  }
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      body: fd,
      headers: { Accept: "application/json" }
    });
    hintEl.textContent = res.ok ? (t("common.sent") || "✅ Request sent!") : (t("common.sendError") || "❌ Error sending.");
    if (res.ok) formEl.reset();
  } catch {
    hintEl.textContent = t("common.connectionError") || "❌ No connection / endpoint problem.";
  }
}

