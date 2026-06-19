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
          ", font=" + (l.font || "-") +
          ", color=" + (l.color || "-") +
          ", finish=" + ((l.finish === "glossy") ? "glossy" : "matte") + (l.customFinish ? " (layer override)" : " (global)") +
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


async function buildDesignerSvgText() {
  try {
    const st = window.ST_DESIGN_STATE || null;
    if (!st || !Array.isArray(st.stickerLayers)) return null;

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
      if (/^blob:/i.test(u)) return ''; // browser-local blobs cannot be fetched after submit in email clients
      try { const r = await fetch(u); if (r.ok) return toDataUrl(await r.text()); } catch(e) {}
      return u;
    };
    const applyRules = window.stApplyTextRules || function(raw){ return String(raw || ''); };

    // Export in the SAME coordinate system as the live designer: center = 0,0.
    // Then build a tight viewBox around the actual content so the sent SVG is centered,
    // visible, and not shifted bottom-right in email/preview clients.
    const bg = (document.getElementById("stBackground") && document.getElementById("stBackground").value) || "none";
    const bgColor = (document.getElementById("stBgColor") && document.getElementById("stBgColor").value) || "#ffffff";
    const bgScaleX = Math.max(70, Math.min(160, Number((document.getElementById("stBgScaleX") && document.getElementById("stBgScaleX").value) || 110))) / 100;
    const bgScaleY = Math.max(70, Math.min(160, Number((document.getElementById("stBgScaleY") && document.getElementById("stBgScaleY").value) || 110))) / 100;

    function addRotatedBox(bounds, cx, cy, w, h, rotDeg, sc){
      w = Math.max(1, Number(w)||1); h = Math.max(1, Number(h)||1); sc = Number(sc)||1;
      const a = (Number(rotDeg)||0) * Math.PI / 180;
      const cos = Math.abs(Math.cos(a)), sin = Math.abs(Math.sin(a));
      const bw = (w * cos + h * sin) * sc;
      const bh = (w * sin + h * cos) * sc;
      bounds.minX = Math.min(bounds.minX, cx - bw/2);
      bounds.maxX = Math.max(bounds.maxX, cx + bw/2);
      bounds.minY = Math.min(bounds.minY, cy - bh/2);
      bounds.maxY = Math.max(bounds.maxY, cy + bh/2);
    }
    function svgRatio(txt){
      try {
        const vb = String(txt||'').match(/viewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
        if (vb && Number(vb[1]) > 0 && Number(vb[2]) > 0) return Number(vb[2]) / Number(vb[1]);
        const wm = String(txt||'').match(/\swidth\s*=\s*["']\s*([\d.]+)/i);
        const hm = String(txt||'').match(/\sheight\s*=\s*["']\s*([\d.]+)/i);
        if (wm && hm && Number(wm[1]) > 0 && Number(hm[1]) > 0) return Number(hm[1]) / Number(wm[1]);
      } catch(e) {}
      return 0.5;
    }

    const elements = [];
    const bounds = {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity};

    // Background first. Use the same stable auto-fit values saved by editor.js when available.
    if (bg !== 'none') {
      let bw = isFinite(Number(st._bgBaseW)) ? Number(st._bgBaseW) : (bg === 'circle' || bg === 'square' || bg === 'rounded-square' ? 300 : 420);
      let bh = isFinite(Number(st._bgBaseH)) ? Number(st._bgBaseH) : (bg === 'circle' || bg === 'square' || bg === 'rounded-square' ? 300 : 240);
      bw *= bgScaleX; bh *= bgScaleY;
      if (bg === 'circle' || bg === 'square' || bg === 'rounded-square') { const ss = Math.max(bw, bh); bw = ss; bh = ss; }
      bounds.minX = Math.min(bounds.minX, -bw/2); bounds.maxX = Math.max(bounds.maxX, bw/2);
      bounds.minY = Math.min(bounds.minY, -bh/2); bounds.maxY = Math.max(bounds.maxY, bh/2);
      elements.push({type:'bg', bg, bgColor, w:bw, h:bh});
    }

    for (let i = 0; i < st.stickerLayers.length; i++) {
      const l = st.stickerLayers[i] || {};
      const cx = Number(l.offsetX)||0, cy = Number(l.offsetY)||0;
      const rot = Number(l.rotationDeg)||0, sc = Number(l.scale)||1;
      const layerW = Math.max(40, Math.min(900, (Number(l.widthCm)||10) * 12));
      if (l.imageUrl) {
        const ratio = svgRatio(l.svgText);
        const iw = layerW, ih = Math.max(20, Math.min(900, layerW * ratio));
        const href = await getSvgHref(l);
        addRotatedBox(bounds, cx, cy, iw, ih, rot, sc);
        elements.push({type:'image', href, cx, cy, rot, sc, w:iw, h:ih});
      } else {
        const txt = applyRules((l.textRaw != null ? l.textRaw : l.text) || '', l.textFlow || 'single');
        if (String(txt).trim()) {
          const lines = String(txt).split(/\r?\n/);
          const fontSize = Math.max(12, Math.min(96, (Number(l.widthCm)||10) * 3.6));
          const maxChars = Math.max.apply(null, lines.map(function(x){ return String(x).length; }).concat([1]));
          const tw = Math.max(24, maxChars * fontSize * 0.68);
          const th = Math.max(fontSize, lines.length * fontSize * 1.08);
          addRotatedBox(bounds, cx, cy, tw, th, rot, sc);
          elements.push({type:'text', txt, lines, cx, cy, rot, sc, font:l.font||'Inter', color:l.color||'#ffffff', fontSize, h:th});
        }
      }
    }

    if (!isFinite(bounds.minX) || !isFinite(bounds.minY)) return null;
    const pad = 80;
    const minX = Math.floor(bounds.minX - pad), minY = Math.floor(bounds.minY - pad);
    const vbW = Math.ceil((bounds.maxX - bounds.minX) + pad*2);
    const vbH = Math.ceil((bounds.maxY - bounds.minY) + pad*2);
    let body = '';

    elements.forEach(function(el){
      if (el.type === 'bg') {
        if (el.bg === 'circle') body += '<ellipse cx="0" cy="0" rx="'+(el.w/2)+'" ry="'+(el.h/2)+'" fill="'+esc(el.bgColor)+'"/>';
        else body += '<rect x="'+(-el.w/2)+'" y="'+(-el.h/2)+'" width="'+el.w+'" height="'+el.h+'" rx="'+(String(el.bg).indexOf('rounded')>=0?28:0)+'" fill="'+esc(el.bgColor)+'"/>';
      } else if (el.type === 'image') {
        body += '<g transform="translate('+el.cx+' '+el.cy+') rotate('+el.rot+') scale('+el.sc+')">';
        body += '<image href="'+esc(el.href)+'" x="'+(-el.w/2)+'" y="'+(-el.h/2)+'" width="'+el.w+'" height="'+el.h+'" preserveAspectRatio="xMidYMid meet"/>';
        body += '</g>';
      } else if (el.type === 'text') {
        body += '<g transform="translate('+el.cx+' '+el.cy+') rotate('+el.rot+') scale('+el.sc+')">';
        const y0 = -((el.lines.length-1) * el.fontSize * 0.54);
        el.lines.forEach(function(line, n){
          body += '<text x="0" y="'+(y0+n*el.fontSize*1.08)+'" dominant-baseline="middle" text-anchor="middle" font-family="'+esc(el.font)+'" font-size="'+el.fontSize+'" font-weight="800" letter-spacing=".03em" fill="'+esc(el.color)+'">'+esc(String(line).toUpperCase())+'</text>';
        });
        body += '</g>';
      }
    });

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+vbW+'" height="'+vbH+'" viewBox="'+minX+' '+minY+' '+vbW+' '+vbH+'" preserveAspectRatio="xMidYMid meet">'+body+'</svg>';
    return svg;
  } catch(e) { return null; }
}
async function buildDesignerSvgFile() {
  const svg = await buildDesignerSvgText();
  if (!svg) return null;
  return new File([new Blob([svg], {type:'image/svg+xml'})], 'stickers-studio-design.svg', {type:'image/svg+xml'});
}

async function updateFinalDesignPreview() {
  try {
    const img = document.getElementById('stFinalDesignPreview');
    if (!img) return;
    const svg = await buildDesignerSvgText();
    if (!svg) return;
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch(e) {}
}
window.updateFinalDesignPreview = updateFinalDesignPreview;

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

  // Sticker designer: use native FormSubmit POST so file attachments + CAPTCHA work.
  // FormSubmit documents file uploads via normal multipart forms, and AJAX uploads are unreliable.
  if (formEl && formEl.id === "formStikeri") {
    const trap = document.getElementById("stWebsiteTrap");
    if (trap && String(trap.value || "").trim()) {
      hintEl.textContent = "❌ Spam check failed.";
      return;
    }
    const em = document.getElementById("stCustomerEmail");
    const em2 = document.getElementById("stCustomerEmailConfirm");
    const a = String((em && em.value) || "").trim().toLowerCase();
    const b = String((em2 && em2.value) || "").trim().toLowerCase();
    if (!a || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) {
      hintEl.textContent = "❌ Please enter a valid email address.";
      return;
    }
    if (a !== b) {
      hintEl.textContent = "❌ Email verification failed: both emails must match.";
      return;
    }

    hintEl.textContent = "Preparing final SVG + CAPTCHA...";
    const summary = buildStikeriSummary();
    const svg = await buildDesignerSvgText();
    if (!svg) {
      hintEl.textContent = "❌ Could not create the final SVG file. Please add text or upload a valid SVG design.";
      return;
    }
    const sumEl = document.getElementById("stOrderSummaryHidden");
    const setEl = document.getElementById("stDesignerSettingsHidden");
    const svgTextEl = document.getElementById("stFinalSvgTextHidden");
    if (sumEl) sumEl.value = summary;
    if (setEl) setEl.value = summary;
    if (svgTextEl) svgTextEl.value = svg;
    if (em) {
      // FormSubmit uses fields named email/_replyto for reply-to handling.
      let hiddenEmail = document.getElementById("stFormSubmitEmailHidden");
      if (!hiddenEmail) {
        hiddenEmail = document.createElement("input");
        hiddenEmail.type = "hidden";
        hiddenEmail.name = "email";
        hiddenEmail.id = "stFormSubmitEmailHidden";
        formEl.appendChild(hiddenEmail);
      }
      hiddenEmail.value = a;
      let reply = document.getElementById("stReplyToHidden");
      if (!reply) {
        reply = document.createElement("input");
        reply.type = "hidden";
        reply.name = "_replyto";
        reply.id = "stReplyToHidden";
        formEl.appendChild(reply);
      }
      reply.value = a;
    }
    const fileInput = document.getElementById("stFinalDesignFile");
    if (fileInput && window.DataTransfer) {
      const dt = new DataTransfer();
      dt.items.add(new File([new Blob([svg], {type:"image/svg+xml"})], "stickers-studio-final-design.svg", {type:"image/svg+xml"}));
      fileInput.files = dt.files;
    } else {
      hintEl.textContent = "❌ Your browser cannot attach the generated SVG file. Try Chrome/Edge desktop.";
      return;
    }
    await updateFinalDesignPreview();
    formEl.action = CONFIG.formEndpoint;
    formEl.method = "POST";
    formEl.enctype = "multipart/form-data";
    formEl.submit();
    return;
  }

  hintEl.textContent = t("common.sending") || "Sending...";
  const fd = new FormData(formEl);
  Object.entries(extra || {}).forEach(function (entry) {
    fd.append(entry[0], entry[1]);
  });
  fd.append("_subject", "New stickers.studio order");
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

(function initFinalPreviewAutoUpdate(){
  function schedule(){
    clearTimeout(window.__stFinalPreviewTimer);
    window.__stFinalPreviewTimer = setTimeout(function(){
      if (window.updateFinalDesignPreview) window.updateFinalDesignPreview();
    }, 250);
  }
  document.addEventListener('input', schedule, true);
  document.addEventListener('change', schedule, true);
  document.addEventListener('click', function(e){
    if (e && e.target && (e.target.closest('#page-design') || e.target.closest('#stPreviewBox'))) schedule();
  }, true);
  window.addEventListener('load', schedule);
})();
