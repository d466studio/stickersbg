// Main bootstrap/orchestrator for the BG STICKERS site.
// Relies on helpers defined in:
// - storage.js  (CONFIG, loadColors, safeFetchJson)
// - pricing.js  (estimatePrice)
// - editor.js   (UI helpers, previews, fonts, gallery)
// - checkout.js (copyText, summaries, postForm)
// - router.js   (hash routing, independent of fetch/fonts)

// --- Custom Select (non-native dropdown) ---
// Native <select>/<option> styling differs between browsers and limits control.
// We keep the original <select> in the DOM (for form submits + existing logic)
// and render a fully custom dropdown UI next to it.
function initCustomSelects() {
  const selects = Array.prototype.slice.call(document.querySelectorAll('select.jsCustomSelect'));
  selects.forEach(function (sel) {
    if (!sel || sel.dataset.customized === '1') return;
    sel.dataset.customized = '1';
    makeCustomSelect(sel);
  });
}

function makeCustomSelect(selectEl) {
  if (!selectEl) return;

  // Wrapper
  const wrap = document.createElement('div');
  wrap.className = 'customSelect';
  wrap.tabIndex = -1;

  // Button
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'customSelectBtn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');

  // Menu
  const menu = document.createElement('div');
  menu.className = 'customSelectMenu';
  menu.setAttribute('role', 'listbox');

  // Insert into DOM (after select)
  selectEl.style.display = 'none';
  selectEl.parentNode.insertBefore(wrap, selectEl.nextSibling);
  wrap.appendChild(btn);
  wrap.appendChild(menu);

  function close() {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function open() {
    wrap.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function toggle() {
    if (wrap.classList.contains('open')) close(); else open();
  }

  function selectedText() {
    const opt = selectEl.options && selectEl.selectedIndex >= 0 ? selectEl.options[selectEl.selectedIndex] : null;
    return (opt && opt.textContent) ? opt.textContent.trim() : '';
  }

  function render() {
    // Button label
    btn.textContent = selectedText() || '—';

    // Menu options
    menu.innerHTML = '';

    // Helper to add item
    function addItem(label, value, disabled, isHeader) {
      const el = document.createElement('div');
      el.className = isHeader ? 'customSelectGroup' : 'customSelectItem';
      el.textContent = label;
      if (isHeader) {
        menu.appendChild(el);
        return;
      }
      el.setAttribute('role', 'option');
      el.dataset.value = value;
      if (disabled) el.classList.add('disabled');
      if (String(value) === String(selectEl.value)) el.classList.add('selected');
      el.addEventListener('click', function () {
        if (disabled) return;
        selectEl.value = value;
        // Keep legacy handlers working
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        render();
        close();
      });
      menu.appendChild(el);
    }

    // Build from select children (supports optgroup)
    Array.prototype.slice.call(selectEl.children || []).forEach(function (child) {
      if (!child) return;
      if (child.tagName === 'OPTGROUP') {
        const gLabel = child.label || '';
        if (gLabel) addItem(gLabel, '', true, true);
        Array.prototype.slice.call(child.children || []).forEach(function (opt) {
          if (!opt || opt.tagName !== 'OPTION') return;
          addItem(opt.textContent || opt.value, opt.value, opt.disabled, false);
        });
      } else if (child.tagName === 'OPTION') {
        addItem(child.textContent || child.value, child.value, child.disabled, false);
      }
    });
  }

  // Click handlers
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    toggle();
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) close();
  });

  // Basic keyboard controls
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'Escape') {
      close();
    }
  });

  // Keep in sync if select value changes programmatically
  selectEl.addEventListener('change', function () {
    render();
  });

  // Observe option changes (font uploads, color list rebuilds)
  try {
    const mo = new MutationObserver(function () {
      render();
    });
    mo.observe(selectEl, { childList: true, subtree: true, attributes: true });
  } catch (_) {}

  render();
}

window.addEventListener("DOMContentLoaded", async function () {
  const _safe = (label, fn) => { try { return fn(); } catch (e) { console.error('[init]', label, e); } };
  let colors = []
  try { colors = await loadColors(); } catch (e) { console.error('[init] loadColors', e); colors = []; }
  _safe('renderColorDock', () => renderColorDock(colors));

  // Show admin-only UI (font upload etc.) only when admin is authenticated locally
  try {
    const isAdmin = localStorage.getItem("admin_authed") === "1";
    document.querySelectorAll(".adminOnly").forEach(function(el){
      el.style.display = isAdmin ? "" : "none";
    });
  } catch(e) {}

  _safe('fillColorSelect npMainColor', () => fillColorSelect(document.getElementById("npMainColor"), colors));
  _safe('fillColorSelect stMainColor', () => fillColorSelect(document.getElementById("stMainColor"), colors));
  _safe('fillColorSelect stBgColor', () => fillColorSelect(document.getElementById("stBgColor"), colors));
  _safe('fillColorSelect avtoColor', () => fillColorSelect(document.getElementById("avtoColor"), colors));

  _safe('renderExtraColors', () => renderExtraColors(
    document.getElementById("npExtraColors"),
    document.getElementById("npExtraColorsHidden"),
    colors,
    null
  ));
  // Sticker designer is intentionally strict: no multi-color selection UI.

  _safe('initTabs', () => initTabs());
  _safe('renderNadpisiPopular', () => renderNadpisiPopular());
  _safe('setNadpisiMode', () => setNadpisiMode("custom"));
  _safe('initBrandDropdown', () => initBrandDropdown());
  _safe('initGallery', () => initGallery());
  // Allow font self-upload (TTF/OTF/WOFF/WOFF2) with guardrails.
  _safe('bootstrapSavedFonts', () => bootstrapSavedFonts());
  _safe('initFontUploads', () => initFontUploads());

  // Replace native selects with custom dropdowns (fonts/colors/finish/shipping/etc).
  _safe('initCustomSelects', () => initCustomSelects());

  // --- Designer canvas panning (mouse / touch) ---
  (function initDesignerPanning(){
    const box = document.getElementById('stPreviewBox') || document.querySelector('#page-design .previewBox');
    const pan = document.getElementById('stPanLayer');
    if (!box || !pan) return;

    // Pan + zoom state
    let panX = 0, panY = 0;
    let scale = 1;

    // Drag / inertia state
    let startX = 0, startY = 0;
    let lastT = 0;
    let vx = 0, vy = 0; // px/ms
    let active = false;
    let raf = 0;

    // Drag mode: pan the canvas, or move the active layer (per-layer movement)
    let dragMode = 'pan'; // 'pan' | 'layer'
    let dragLayerIdx = -1;
    let layerStartX = 0, layerStartY = 0;

    function apply(){
      pan.style.setProperty('--pan-x', panX + 'px');
      pan.style.setProperty('--pan-y', panY + 'px');
      pan.style.setProperty('--pan-scale', String(scale));
    }

    function resizeCanvas(){
      try{
        const r = box.getBoundingClientRect();
        // Give generous pan range so long text / big backgrounds can be explored.
        pan.style.setProperty('--pan-w', Math.round(r.width * 3.2) + 'px');
        pan.style.setProperty('--pan-h', Math.round(r.height * 3.0) + 'px');
      }catch(e){}
    }

    function stopInertia(){
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      vx = 0; vy = 0;
    }

    function startInertia(){
      stopInertia();
      const decay = 0.92; // per frame
      const minV = 0.02; // px/ms
      let prev = performance.now();
      raf = requestAnimationFrame(function step(now){
        const dt = Math.max(8, now - prev);
        prev = now;
        // Convert to per-frame movement
        panX += vx * dt;
        panY += vy * dt;
        vx *= decay;
        vy *= decay;
        apply();
        if (Math.abs(vx) > minV || Math.abs(vy) > minV) {
          raf = requestAnimationFrame(step);
        } else {
          stopInertia();
        }
      });
    }

    function setScale(next, anchorClientX, anchorClientY){
      const clamped = Math.max(0.35, Math.min(3.0, next));
      if (clamped === scale) return;
      // Zoom around a point (mouse position). Convert anchor to box-centered coords.
      const r = box.getBoundingClientRect();
      const ax = (anchorClientX - (r.left + r.width/2));
      const ay = (anchorClientY - (r.top + r.height/2));
      // Adjust pan so the anchor stays visually stable.
      // Because transform = translate(center + pan) scale(scale), we compensate using scale ratio.
      const ratio = clamped / scale;
      panX = ax - (ax - panX) * ratio;
      panY = ay - (ay - panY) * ratio;
      scale = clamped;
      apply();
    }

    function resetView(){
      stopInertia();
      panX = 0; panY = 0; scale = 1;
      apply();
    }

    function zoomToFit(){
      stopInertia();
      // Normalize view so bounds are measured at scale 1.
      const prev = { panX: panX, panY: panY, scale: scale };
      panX = 0; panY = 0; scale = 1;
      apply();
      requestAnimationFrame(function(){
        try{
          const rBox = box.getBoundingClientRect();
          const els = [];
          const bg = document.getElementById('stBgPreview');
          if (bg && bg.style.display !== 'none') els.push(bg);
          const layers = document.getElementById('stLayersPreview');
          if (layers) layers.querySelectorAll('.layerEl').forEach(function(el){ els.push(el); });
          if (!els.length){ resetView(); return; }

          let minL=Infinity, minT=Infinity, maxR=-Infinity, maxB=-Infinity;
          els.forEach(function(el){
            const rr = el.getBoundingClientRect();
            if (!rr || !isFinite(rr.left)) return;
            minL = Math.min(minL, rr.left);
            minT = Math.min(minT, rr.top);
            maxR = Math.max(maxR, rr.right);
            maxB = Math.max(maxB, rr.bottom);
          });
          if (!isFinite(minL) || !isFinite(maxR)) { resetView(); return; }
          const bw = Math.max(20, maxR - minL);
          const bh = Math.max(20, maxB - minT);
          const pad = 0.86; // leave margins
          const nextScale = Math.max(0.35, Math.min(3.0, pad * Math.min(rBox.width / bw, rBox.height / bh)));
          panX = 0; panY = 0; scale = nextScale;
          apply();
        }catch(e){
          panX = prev.panX; panY = prev.panY; scale = prev.scale; apply();
        }
      });
    }

    // Cursor style
    box.style.cursor = 'grab';

    box.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Decide if we are moving the active layer or panning the whole canvas.
      dragMode = 'pan';
      dragLayerIdx = -1;
      try {
        const hit = e.target && e.target.closest ? e.target.closest('.layerEl') : null;
        const st = (typeof _ensureDesignerState === 'function') ? _ensureDesignerState() : (window.ST_DESIGN_STATE || null);
        const activeKey = st && st.activeKey ? String(st.activeKey) : 'sticker:0';
        if (hit && hit.dataset && hit.dataset.key && String(hit.dataset.key).startsWith('sticker:')) {
          const hitKey = String(hit.dataset.key);
          // Click selects the layer under the cursor.
          if (st) {
            st.activeKey = hitKey;
            try { _renderLayerBar(true); } catch(e) {}
            try { _applyInputsFromActiveLayer(); } catch(e) {}
          }
          dragMode = 'layer';
          dragLayerIdx = Number(hitKey.split(':')[1] || 0) || 0;
          const layer = st && Array.isArray(st.stickerLayers) ? st.stickerLayers[dragLayerIdx] : null;
          layerStartX = isFinite(Number(layer && layer.offsetX)) ? Number(layer.offsetX) : 0;
          layerStartY = isFinite(Number(layer && layer.offsetY)) ? Number(layer.offsetY) : 0;
          box.style.cursor = 'grabbing';
        } else if (hit && hit.dataset && hit.dataset.key && hit.dataset.key === activeKey && activeKey.startsWith('sticker:')) {
          dragMode = 'layer';
          dragLayerIdx = Number(activeKey.split(':')[1] || 0) || 0;
          const layer = st && Array.isArray(st.stickerLayers) ? st.stickerLayers[dragLayerIdx] : null;
          layerStartX = isFinite(Number(layer && layer.offsetX)) ? Number(layer.offsetX) : 0;
          layerStartY = isFinite(Number(layer && layer.offsetY)) ? Number(layer.offsetY) : 0;
          box.style.cursor = 'grabbing';
        }
      } catch (e2) {}

      stopInertia();
      active = true;
      startX = e.clientX;
      startY = e.clientY;
      lastT = performance.now();
      vx = 0; vy = 0;
      box.setPointerCapture && box.setPointerCapture(e.pointerId);
      box.style.cursor = 'grabbing';
      e.preventDefault();
    });

    box.addEventListener('pointermove', function(e){
      if (!active) return;
      const now = performance.now();
      const dt = Math.max(8, now - lastT);
      lastT = now;
      const dx = (e.clientX - startX);
      const dy = (e.clientY - startY);
      startX = e.clientX;
      startY = e.clientY;
      if (dragMode === 'layer' && dragLayerIdx >= 0) {
        // Move the active layer in design space (account for zoom level).
        const st = (typeof _ensureDesignerState === 'function') ? _ensureDesignerState() : (window.ST_DESIGN_STATE || null);
        if (st && Array.isArray(st.stickerLayers) && st.stickerLayers[dragLayerIdx]) {
          // dx/dy are incremental since the last pointermove.
          // Accumulate movement so only the dragged layer moves (not the whole canvas).
          const nx = layerStartX + (dx / scale);
          const ny = layerStartY + (dy / scale);
          st.stickerLayers[dragLayerIdx].offsetX = nx;
          st.stickerLayers[dragLayerIdx].offsetY = ny;

          // Update the running start position so subsequent moves continue from the latest.
          layerStartX = nx;
          layerStartY = ny;

          // Apply immediately for smoothness
          const hit = document.querySelector('.layerEl[data-key="sticker:' + dragLayerIdx + '"]');
          if (hit) {
            const rot = isFinite(Number(st.stickerLayers[dragLayerIdx].rotationDeg)) ? Number(st.stickerLayers[dragLayerIdx].rotationDeg) : 0;
                        const sc = isFinite(Number(st.stickerLayers[dragLayerIdx].scale)) ? Number(st.stickerLayers[dragLayerIdx].scale) : 1;
            hit.style.transform = `translate(-50%, -50%) translate(${nx}px, ${ny}px) rotate(${rot}deg) scale(${sc})`;
          }
        }
        // layer drag should not build inertia
        vx = 0; vy = 0;
      } else {
        panX += dx;
        panY += dy;
        // velocity (px/ms)
        vx = dx / dt;
        vy = dy / dt;
        apply();
      }
      e.preventDefault();
    });

    function end(){
      if (!active) return;
      active = false;
      box.style.cursor = 'grab';
      // Commit layer move by rerendering once
      if (dragMode === 'layer') {
        try { if (typeof window.updateStikeri === 'function') window.updateStikeri(); } catch(e) {}
      }
      // Start inertia only if user was actually moving
      if (dragMode !== 'layer' && (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05)) startInertia();
    }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);

    // Wheel zoom (trackpad/mouse)
    box.addEventListener('wheel', function(e){
      // ctrlKey often means browser zoom on trackpads; still allow canvas zoom but prevent page zoom.
      e.preventDefault();
      stopInertia();
      const dir = e.deltaY > 0 ? -1 : 1;
      const factor = dir > 0 ? 1.08 : 1/1.08;
      setScale(scale * factor, e.clientX, e.clientY);
    }, { passive: false });

    // Double click = zoom to fit
    box.addEventListener('dblclick', function(e){
      e.preventDefault();
      zoomToFit();
    });

    // Keyboard panning (when design page is active)
    document.addEventListener('keydown', function(e){
      const designPage = document.getElementById('page-design');
      if (!designPage || !designPage.classList.contains('active')) return;
      const key = e.key;
      const step = e.shiftKey ? 80 : 32;
      if (key === 'ArrowLeft'){ panX += step; apply(); e.preventDefault(); }
      else if (key === 'ArrowRight'){ panX -= step; apply(); e.preventDefault(); }
      else if (key === 'ArrowUp'){ panY += step; apply(); e.preventDefault(); }
      else if (key === 'ArrowDown'){ panY -= step; apply(); e.preventDefault(); }
      else if ((key === '+' || key === '=' ) && (e.ctrlKey || e.metaKey)) { setScale(scale * 1.08, box.getBoundingClientRect().left + box.getBoundingClientRect().width/2, box.getBoundingClientRect().top + box.getBoundingClientRect().height/2); e.preventDefault(); }
      else if ((key === '-' ) && (e.ctrlKey || e.metaKey)) { setScale(scale / 1.08, box.getBoundingClientRect().left + box.getBoundingClientRect().width/2, box.getBoundingClientRect().top + box.getBoundingClientRect().height/2); e.preventDefault(); }
      else if ((key === '0') && (e.ctrlKey || e.metaKey)) { resetView(); e.preventDefault(); }
    });

    // Hook up zoom buttons if present
    const gridBtn = document.getElementById('stGridToggle');
    const whiteBtn = document.getElementById('stWhiteBgToggle');
    const zIn = document.getElementById('stZoomIn');
    const zOut = document.getElementById('stZoomOut');
    const zReset = document.getElementById('stZoomReset');
    function centerAnchor(){
      const r = box.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    }
    if (zIn) zIn.addEventListener('click', function(){ const a = centerAnchor(); setScale(scale * 1.12, a.x, a.y); });
    if (zOut) zOut.addEventListener('click', function(){ const a = centerAnchor(); setScale(scale / 1.12, a.x, a.y); });
    if (zReset) zReset.addEventListener('click', resetView);
    if (gridBtn) gridBtn.addEventListener('click', function(){
      box.classList.toggle('gridOn');
      gridBtn.classList.toggle('active');
    });

    // White preview background toggle (useful for SVG uploads)
    function applyWhitePref(){
      const pref = (typeof window.__ST_PREVIEW_WHITE_BG_PREF__ === 'boolean') ? window.__ST_PREVIEW_WHITE_BG_PREF__ : null;
      const on = pref === true;
      if (whiteBtn) whiteBtn.classList.toggle('active', on);
      // The actual background class is applied in updateStikeri() (editor.js),
      // but we also apply immediately for responsiveness.
      if (pref !== null) {
        box.classList.toggle('whiteBgOn', on);
      }
    }
    if (whiteBtn) {
      whiteBtn.addEventListener('click', function(){
        const pref = (typeof window.__ST_PREVIEW_WHITE_BG_PREF__ === 'boolean') ? window.__ST_PREVIEW_WHITE_BG_PREF__ : null;
        // Toggle explicit preference: null -> true, true -> false, false -> true
        window.__ST_PREVIEW_WHITE_BG_PREF__ = (pref === true) ? false : true;
        applyWhitePref();
        // re-render to apply in context (image mode / dark text)
        try { if (typeof window.updateStikeri === 'function') window.updateStikeri(); } catch(e) {}
      });
      applyWhitePref();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    apply();

    // Expose for other controls (reset design)
    window.__ST_CANVAS__ = { resetView: resetView, zoomToFit: zoomToFit };
  })();

  ["npText", "npWidth", "npFont", "npMainColor"].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", updateNadpisi);
    el.addEventListener("change", updateNadpisi);
  });
  const npExtra = document.getElementById("npExtraColors");
  if (npExtra) {
    npExtra.addEventListener("change", updateNadpisi);
  }

  ["stText", "stTextFlow", "stWidth", "stFont", "stMainColor", "stBackground", "stFinish", "stQty", "stBgColor", "stBgScaleX", "stBgScaleY", "stBgFinish", "stImgRotate", "stImgScale"].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    function handle(){
      if (id === "stWidth" && typeof _scaleAllStickerLayersToWholeWidth === "function") _scaleAllStickerLayersToWholeWidth(el.value);
      syncStickerDesignerFromInputs();
      updateStikeri();
      if (id === "stWidth" && typeof _applyInputsFromActiveLayer === "function") _applyInputsFromActiveLayer();
    }
    el.addEventListener("input", handle);
    el.addEventListener("change", handle);
  });

  // Rotation value label
  (function(){
    const r = document.getElementById('stImgRotate');
    const v = document.getElementById('stImgRotateVal');
    if (!r || !v) return;
    function sync(){ v.textContent = String(Number(r.value || 0)) + '°'; }
    r.addEventListener('input', sync);
    r.addEventListener('change', sync);
    sync();
  })();

  // Scale value label
  (function(){
    const r = document.getElementById('stImgScale');
    const v = document.getElementById('stImgScaleVal');
    if (!r || !v) return;
    function sync(){ v.textContent = String(Number(r.value || 100)) + '%'; }
    r.addEventListener('input', sync);
    r.addEventListener('change', sync);
    sync();
  })();
;

  // Text flow segmented control (single line vs word-per-line).
  (function initTextFlow(){
    const hidden = document.getElementById('stTextFlow');
    // IMPORTANT: there are multiple .segRow blocks on the design page.
    // Bind directly to the intended buttons so the control never "misses".
    const singleBtn = document.getElementById('stFlowSingle');
    const wordsBtn = document.getElementById('stFlowWords');
    function setFlow(v){
      if (hidden) {
        hidden.value = v;
        try {
          hidden.dispatchEvent(new Event('input', { bubbles: true }));
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        } catch(e) {}
      }
      if (singleBtn) singleBtn.classList.toggle('active', v === 'single');
      if (wordsBtn) wordsBtn.classList.toggle('active', v === 'words');
      // Ensure designer state gets updated before repaint
      if (typeof syncStickerDesignerFromInputs === 'function') syncStickerDesignerFromInputs();
      if (typeof updateStikeri === 'function') updateStikeri();
    }
    if (singleBtn) singleBtn.addEventListener('click', function(){ setFlow('single'); });
    if (wordsBtn) wordsBtn.addEventListener('click', function(){ setFlow('words'); });
    // Initialize active state from hidden value (default: single).
    setFlow((hidden && hidden.value) ? hidden.value : 'single');
  })();

  // Ensure designer state exists early so layers/background/UI always work.
  (function bootstrapDesignerState(){
    try {
      // Run after current tick so DOM is fully ready.
      setTimeout(function(){
        if (typeof _ensureDesignerState === 'function') _ensureDesignerState();
        // Render layer bar at least once.
        if (typeof _renderLayerBar === 'function') _renderLayerBar(false);
        if (typeof _applyInputsFromActiveLayer === 'function') _applyInputsFromActiveLayer();
        if (typeof updateStikeri === 'function') updateStikeri();
      }, 0);
    } catch(e) {}
  })();

  // --- Sticker Designer Layers (up to 5) ---
  // State lives in window.ST_DESIGN_STATE:
  // {
  //   activeKey: 'background' | 'sticker:0'...
  //   stickerLayers: [{mode,textRaw,textFlow,text,font,color,imageUrl,isSvg,offsetX,offsetY,rotationDeg,scale}...]
  // }
  function _ensureDesignerState() {
    if (window.ST_DESIGN_STATE && Array.isArray(window.ST_DESIGN_STATE.stickerLayers)) return window.ST_DESIGN_STATE;
    const initRaw = (document.getElementById("stText") && document.getElementById("stText").value) || "";
    const initFlow = (document.getElementById("stTextFlow") && document.getElementById("stTextFlow").value) || "single";
    const initFont = (document.getElementById("stFont") && document.getElementById("stFont").value) || "Inter";
    const initColor = (document.getElementById("stMainColor") && document.getElementById("stMainColor").value) || "#FFFFFF";
    const applyRules = (typeof window.stApplyTextRules === 'function')
      ? window.stApplyTextRules
      : function(raw, flow){
          const f = String(flow||'single').trim()==='words'?'words':'single';
          let out = String(raw||'');
          if (f==='words') out = out.replace(/\r?\n/g,' ').trim().split(/\s+/).filter(Boolean).slice(0,12).join('\n');
          else out = out.replace(/\r?\n/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,80);
          return out;
        };
    window.ST_DESIGN_STATE = {
      activeKey: "sticker:0",
      wholeWidthCm: Number((document.getElementById("stWidth") && document.getElementById("stWidth").value) || 10),
      stickerLayers: [
        {
          mode: "text",
          textRaw: initRaw,
          textFlow: (String(initFlow).trim()==='words') ? 'words' : 'single',
          text: applyRules(initRaw, initFlow),
          font: initFont,
          color: initColor,
          imageUrl: "",
          isSvg: false,
          offsetX: 0,
          offsetY: 0,
          rotationDeg: 0,
          scale: 1,
          widthCm: 10
        }
      ]
    };
    return window.ST_DESIGN_STATE;
  }

  function _designerHasBackground() {
    const bg = (document.getElementById("stBackground") && document.getElementById("stBackground").value) || "none";
    return bg && bg !== "none";
  }

  function _maxStickerLayers() {
    // Total max layers = 5. If background is enabled, one slot is reserved for it.
    return _designerHasBackground() ? 4 : 5;
  }

  function _scaleAllStickerLayersToWholeWidth(newWidthCm) {
    const st = _ensureDesignerState();
    const n = Number(newWidthCm);
    if (!isFinite(n) || n <= 0) return;
    const old = isFinite(Number(st.wholeWidthCm)) ? Number(st.wholeWidthCm) : n;
    st.wholeWidthCm = n;
    if (!old || Math.abs(old - n) < 0.0001) return;
    const ratio = n / old;
    if (!isFinite(ratio) || ratio <= 0) return;
    (st.stickerLayers || []).forEach(function(layer){
      const current = isFinite(Number(layer.widthCm)) ? Number(layer.widthCm) : old;
      layer.widthCm = Math.max(1, Math.min(200, current * ratio));
    });
    const active = st.activeKey || 'sticker:0';
    if (active.startsWith('sticker:')) {
      const idx = Number(active.split(':')[1] || 0);
      const layer = st.stickerLayers[idx];
      const layerWidthEl = document.getElementById('stLayerWidth');
      if (layerWidthEl && layer) layerWidthEl.value = String(Math.round(Number(layer.widthCm) * 10) / 10);
    }
  }

  
  function _applyTextFlowRules(text, flow) {
    let t = String(text || "");
    const f = String(flow || "single").trim();
    if (f === "words") {
      const words = t.replace(/\r?\n/g, " ").trim().split(/\s+/).filter(Boolean).slice(0, 12);
      t = words.join("\n");
    } else {
      t = t.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ");
      t = t.slice(0, 40);
    }
    const maxLines = f === "words" ? 12 : 1;
    const lines = String(t).split(/\r?\n/).slice(0, maxLines).map(l => l.slice(0, 20));
    return lines.join("\n");
  }


function syncStickerDesignerFromInputs() {
    const st = _ensureDesignerState();
    const active = st.activeKey || "sticker:0";

    // If the active layer isn't a sticker (e.g., background), we still apply text controls to sticker layer 0
    // so the preview responds immediately.
    let idx = 0;
    if (String(active).startsWith("sticker:")) {
      idx = Number(String(active).split(":")[1] || 0) || 0;
    }

    if (!Array.isArray(st.stickerLayers) || !st.stickerLayers.length) {
      st.stickerLayers = [{ mode: "text", textRaw: "", textFlow: "single", text: "", font: "Inter", color: "#FFFFFF", imageUrl: "", isSvg:false, offsetX:0, offsetY:0, rotationDeg:0, scale:1, widthCm:10 }];
    }
    if (!st.stickerLayers[idx]) {
      st.stickerLayers[idx] = { mode: "text", textRaw: "", textFlow: "single", text: "", font: "Inter", color: "#FFFFFF", imageUrl: "", isSvg:false, offsetX:0, offsetY:0, rotationDeg:0, scale:1, widthCm:10 };
    }

    const layer = st.stickerLayers[idx];
    layer.mode = (document.getElementById("designMode") && document.getElementById("designMode").value) || layer.mode || "text";

    const raw = (document.getElementById("stText") && document.getElementById("stText").value) || "";
    const flow = (document.getElementById("stTextFlow") && document.getElementById("stTextFlow").value) || "single";
    layer.textRaw = raw;
    layer.textFlow = (String(flow).trim() === "words") ? "words" : "single";

    if (layer.mode === "text") {
      // Do NOT mutate the textarea value; keep raw input and only transform for rendering.
      const applyRules = (typeof window.stApplyTextRules === 'function')
        ? window.stApplyTextRules
        : _applyTextFlowRules;
      layer.text = applyRules(layer.textRaw, layer.textFlow);
    } else {
      layer.text = "";
    }

    layer.font = (document.getElementById("stFont") && document.getElementById("stFont").value) || layer.font || "Inter";
    layer.color = (document.getElementById("stMainColor") && document.getElementById("stMainColor").value) || layer.color || "#FFFFFF";
    const lwEl = document.getElementById("stLayerWidth");
    const lwVal = lwEl ? Number(lwEl.value || layer.widthCm || 10) : Number(layer.widthCm || 10);
    layer.widthCm = isFinite(lwVal) ? Math.max(1, Math.min(200, lwVal)) : (layer.widthCm || 10);

    // Image rotation/scale (only when an uploaded SVG exists on this layer).
    const hasUpload = (layer.mode !== 'text') && !!layer.imageUrl;
    if (hasUpload) {
      const rotEl = document.getElementById('stImgRotate');
      const rotVal = rotEl ? Number(rotEl.value || 0) : 0;
      layer.rotationDeg = isFinite(rotVal) ? rotVal : 0;
      const scEl = document.getElementById('stImgScale');
      const scVal = scEl ? Number(scEl.value || 100) : 100;
      const sc = isFinite(scVal) ? scVal : 100;
      layer.scale = Math.max(0.2, Math.min(3.0, sc / 100));
    } else {
      layer.rotationDeg = isFinite(Number(layer.rotationDeg)) ? Number(layer.rotationDeg) : 0;
      layer.scale = isFinite(Number(layer.scale)) ? Number(layer.scale) : 1;
    }

// Persist a compact layers payload into a hidden form field (for orders).
    try {
      const out = {
        stickerLayers: st.stickerLayers.map(function (l) {
          return {
            mode: l.mode,
            text: l.mode === "text" ? (l.text || "") : "",
            font: l.font || "Inter",
            color: l.color || "#FFFFFF",
            hasImage: !!(l.imageUrl),
            assetId: l.assetId || "",
            rotationDeg: isFinite(Number(l.rotationDeg)) ? Number(l.rotationDeg) : 0,
            scale: isFinite(Number(l.scale)) ? Number(l.scale) : 1,
            widthCm: isFinite(Number(l.widthCm)) ? Number(l.widthCm) : 10
          };
        }),
        hasBackground: _designerHasBackground()
      };
      const hidden = document.getElementById("stLayersData");
      if (hidden) hidden.value = JSON.stringify(out);
    } catch (e) {}
  }


  function _applyInputsFromActiveLayer() {
    const st = _ensureDesignerState();
    const active = st.activeKey || "sticker:0";

    const modeWrap = document.getElementById("designerMode");
    const textWrap = document.getElementById("stTextWrap");
    const fileWrap = document.getElementById("stFileWrap");
    const assetsWrap = document.getElementById("stAssetsWrap");
    const rotateWrap = document.getElementById('stRotateWrap');
    const scaleWrap = document.getElementById('stScaleWrap');
    const scaleEl = document.getElementById('stImgScale');
    const scaleValEl = document.getElementById('stImgScaleVal');
    const rotEl = document.getElementById('stImgRotate');
    const rotValEl = document.getElementById('stImgRotateVal');
    const fileInput = document.getElementById("stFile");
    const textInput = document.getElementById("stText");
    const fontSel = document.getElementById("stFont");
    const colorSel = document.getElementById("stMainColor");
    const finishSel = document.getElementById("stFinish");
    const layerWidthEl = document.getElementById("stLayerWidth");

    const editingBackground = active === "background";
    // When editing background, hide sticker-layer controls (keeps UI disciplined).
    if (modeWrap) modeWrap.style.display = editingBackground ? "none" : "";
    if (textWrap) textWrap.style.display = editingBackground ? "none" : "";
    if (fileWrap) fileWrap.style.display = editingBackground ? "none" : "";
    // Some controls are not wrapped in <label> in the current layout. Guard against null.
    const _setWrapVisible = function (el, visible) {
      if (!el) return;
      const wrap = el.closest && (el.closest(".field") || el.closest("label") || el.closest(".row") || el.parentElement);
      if (!wrap) return;
      wrap.style.display = visible ? "" : "none";
    };
    _setWrapVisible(fontSel, !editingBackground);
    _setWrapVisible(colorSel, !editingBackground);
    _setWrapVisible(finishSel, !editingBackground);

    // Background option block is controlled by updateStikeri() based on stBackground.

    if (editingBackground) {
      return;
    }

    const idx = Number(active.split(":")[1] || 0);
    const layer = st.stickerLayers[idx] || st.stickerLayers[0];
    if (!layer) return;

    // Mode
    const hidden = document.getElementById("designMode");
    if (hidden) hidden.value = layer.mode || "text";
    if (modeWrap) {
      modeWrap.querySelectorAll(".segBtn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-mode") === (layer.mode || "text"));
      });
    }
    // Keep the textarea showing the raw text, not the rendered text.
    if (textInput) textInput.value = layer.textRaw ?? layer.text ?? "";
    // Sync text-flow segmented control from the active layer.
    try {
      const hf = document.getElementById('stTextFlow');
      if (hf) hf.value = (String(layer.textFlow||'single').trim()==='words') ? 'words' : 'single';
      const sBtn = document.getElementById('stFlowSingle');
      const wBtn = document.getElementById('stFlowWords');
      if (sBtn) sBtn.classList.toggle('active', (hf && hf.value)==='single');
      if (wBtn) wBtn.classList.toggle('active', (hf && hf.value)==='words');
    } catch(e) {}
    if (fontSel) fontSel.value = layer.font || "Inter";
    if (colorSel) colorSel.value = layer.color || (colorSel.value || "#FFFFFF");
    if (layerWidthEl) layerWidthEl.value = String(isFinite(Number(layer.widthCm)) ? Number(layer.widthCm) : 10);

    // Show correct input (text vs upload vs assets)
    const m = (layer.mode || 'text');
    const isText = m === 'text';
    const isUpload = m === 'upload';
    const isAssets = m === 'assets';
    if (textWrap) textWrap.style.display = isText ? '' : 'none';
    if (fileWrap) fileWrap.style.display = isUpload ? '' : 'none';
    if (assetsWrap) assetsWrap.style.display = isAssets ? '' : 'none';

    const hasUpload = (!isText) && !!(layer && layer.imageUrl);
    if (rotateWrap) rotateWrap.style.display = hasUpload ? '' : 'none';
    if (scaleWrap) scaleWrap.style.display = hasUpload ? '' : 'none';
    if (textInput) textInput.required = isText;
    if (fileInput) fileInput.required = false;

    // Rotation/Scale UI sync
    if (hasUpload) {
      const v = isFinite(Number(layer.rotationDeg)) ? Number(layer.rotationDeg) : 0;
      if (rotEl) rotEl.value = String(v);
      if (rotValEl) rotValEl.textContent = String(v) + "°";
    }

    // Hint about existing upload (can't re-populate file input)
    const fileHint = document.getElementById("stFileHint");
    if (fileHint) {
      if (isUpload && layer.imageUrl) fileHint.textContent = "This layer has an uploaded file.";
      else if (isAssets && layer.imageUrl) fileHint.textContent = "This layer uses a library asset.";
      else if (isUpload) fileHint.textContent = "Only SVG / plain SVG files are accepted. Upload is available only before the design has active content.";
    }
  }

  function _renderLayerBar(animate) {
    const st = _ensureDesignerState();
    const wrap = document.getElementById("stLayerBtns");
    if (!wrap) return;

    // FLIP animation support: capture previous positions before rerender.
    let prev = null;
    if (animate) {
      prev = {};
      wrap.querySelectorAll(".layerBtn").forEach(function (b) {
        const k = b.getAttribute("data-key") || "";
        if (!k) return;
        prev[k] = b.getBoundingClientRect();
      });
    }

    wrap.innerHTML = "";

    const hasBg = _designerHasBackground();
    if (hasBg) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "layerBtn" + (st.activeKey === "background" ? " active" : "");
      b.setAttribute("data-key", "background");
      b.textContent = "Background";
      wrap.appendChild(b);
    }

    st.stickerLayers.forEach(function (layer, idx) {
      const key = "sticker:" + idx;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "layerBtn" + (st.activeKey === key ? " active" : "");
      // Drag reordering is enabled via a handle (not the whole button).
      b.draggable = false;
      b.setAttribute("data-index", String(idx));
      // Only show a small meta hint when this layer is an image upload.
      const meta = (layer && layer.imageUrl) ? 'SVG' : '';

      const handle = document.createElement("span");
      handle.className = "layerHandle";
      handle.setAttribute("draggable", "true");
      handle.setAttribute("title", "Drag to reorder");
      handle.setAttribute("aria-label", "Drag to reorder");
      handle.innerHTML = "<span class=\"dots\" aria-hidden=\"true\">⋮⋮</span>";

      const label = document.createElement("span");
      label.className = "layerLabel";
      label.textContent = "Layer " + (idx + 1);

      b.appendChild(handle);
      b.appendChild(label);
      if (meta) {
        const m = document.createElement("span");
        m.className = "layerMeta";
        m.textContent = meta;
        b.appendChild(m);
      }
      b.setAttribute("data-key", key);
      wrap.appendChild(b);
    });

    const addBtn = document.getElementById("stAddLayer");
    const remBtn = document.getElementById("stRemoveLayer");
    const maxL = _maxStickerLayers();
    if (addBtn) addBtn.disabled = st.stickerLayers.length >= maxL;
    if (remBtn) {
      const activeSticker = st.activeKey && st.activeKey.startsWith("sticker:");
      remBtn.disabled = !activeSticker || st.stickerLayers.length <= 1;
    }

    // Apply FLIP animation after rerender.
    if (animate && prev) {
      const next = {};
      wrap.querySelectorAll(".layerBtn").forEach(function (b) {
        const k = b.getAttribute("data-key") || "";
        if (!k) return;
        next[k] = b.getBoundingClientRect();
      });
      wrap.querySelectorAll(".layerBtn").forEach(function (b) {
        const k = b.getAttribute("data-key") || "";
        if (!k || !prev[k] || !next[k]) return;
        const dx = prev[k].left - next[k].left;
        const dy = prev[k].top - next[k].top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        b.style.transform = "translate(" + dx + "px," + dy + "px)";
        b.style.transition = "transform 0s";
        b.getBoundingClientRect();
        requestAnimationFrame(function () {
          b.style.transition = "transform 180ms cubic-bezier(.2,.8,.2,1)";
          b.style.transform = "translate(0px,0px)";
        });
      });
    }
  }

  (function initLayerBar() {
    const st = _ensureDesignerState();
    const bar = document.getElementById("stLayerBar");
    const addBtn = document.getElementById("stAddLayer");
    const remBtn = document.getElementById("stRemoveLayer");
    if (!bar) return;

    // --- Drag-to-reorder sticker layers (background is fixed) ---
    let dragFromIndex = null;
    const btnWrap = document.getElementById("stLayerBtns");
    if (btnWrap) {
      btnWrap.addEventListener("dragstart", function (e) {
        // Dragging starts ONLY from the handle.
        const handle = e.target && e.target.closest && e.target.closest(".layerHandle");
        const btn = handle && handle.closest && handle.closest(".layerBtn");
        if (!btn) return;
        const key = btn.getAttribute("data-key") || "";
        if (key === "background") return;
        const idx = Number(btn.getAttribute("data-index"));
        if (!isFinite(idx)) return;
        dragFromIndex = idx;
        try {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(idx));
        } catch (_) {}
        btn.classList.add("dragging");
      });

      btnWrap.addEventListener("dragend", function (e) {
        const btn = e.target && e.target.closest && e.target.closest(".layerBtn");
        if (btn) btn.classList.remove("dragging");
        dragFromIndex = null;
        btnWrap.querySelectorAll(".layerBtn").forEach(function (b) {
          b.classList.remove("dragOver");
        });
      });

      btnWrap.addEventListener("dragover", function (e) {
        const btn = e.target && e.target.closest && e.target.closest(".layerBtn");
        if (!btn) return;
        const key = btn.getAttribute("data-key") || "";
        if (key === "background") return;
        e.preventDefault();
        btnWrap.querySelectorAll(".layerBtn").forEach(function (b) {
          b.classList.remove("dragOver");
        });
        btn.classList.add("dragOver");
      });

      btnWrap.addEventListener("drop", function (e) {
        const btn = e.target && e.target.closest && e.target.closest(".layerBtn");
        if (!btn) return;
        const key = btn.getAttribute("data-key") || "";
        if (key === "background") return;
        e.preventDefault();

        const st = _ensureDesignerState();
        let from = dragFromIndex;
        if (!isFinite(from)) {
          const v = Number((e.dataTransfer && e.dataTransfer.getData("text/plain")) || NaN);
          if (isFinite(v)) from = v;
        }
        const to = Number(btn.getAttribute("data-index"));
        if (!isFinite(from) || !isFinite(to) || from === to) return;
        if (!st.stickerLayers[from] || !st.stickerLayers[to]) return;

        const moved = st.stickerLayers.splice(from, 1)[0];
        st.stickerLayers.splice(to, 0, moved);

        // Keep the active sticker layer pointing to the same logical layer.
        if (st.activeKey && st.activeKey.startsWith("sticker:")) {
          const activeIdx = Number(st.activeKey.split(":")[1] || 0);
          let newActive = activeIdx;
          if (activeIdx === from) newActive = to;
          else if (from < activeIdx && activeIdx <= to) newActive = activeIdx - 1;
          else if (to <= activeIdx && activeIdx < from) newActive = activeIdx + 1;
          st.activeKey = "sticker:" + Math.max(0, Math.min(st.stickerLayers.length - 1, newActive));
        }

        _renderLayerBar(true);
        _applyInputsFromActiveLayer();
        syncStickerDesignerFromInputs();
        updateStikeri();
      });
    }

    bar.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest && e.target.closest(".layerBtn");
      if (!btn) return;
      // Clicking the drag handle shouldn't switch layers.
      if (e.target && e.target.closest && e.target.closest(".layerHandle")) return;
      syncStickerDesignerFromInputs();
      st.activeKey = btn.getAttribute("data-key") || "sticker:0";
      _renderLayerBar(false);
      _applyInputsFromActiveLayer();
      updateStikeri();
    });

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        syncStickerDesignerFromInputs();
        const maxL = _maxStickerLayers();
        if (st.stickerLayers.length >= maxL) return;
        st.stickerLayers.push({
          mode: "text",
          textRaw: "",
          textFlow: (document.getElementById('stTextFlow') && document.getElementById('stTextFlow').value) || 'single',
          text: "",
          font: (document.getElementById("stFont") && document.getElementById("stFont").value) || "Inter",
          color: (document.getElementById("stMainColor") && document.getElementById("stMainColor").value) || "#FFFFFF",
          imageUrl: "",
          isSvg: false,
          offsetX: 0,
          offsetY: 0,
          rotationDeg: 0,
          scale: 1,
          widthCm: 10
        });
        st.activeKey = "sticker:" + (st.stickerLayers.length - 1);
        _renderLayerBar(false);
        _applyInputsFromActiveLayer();
        updateStikeri();
      });
    }

    if (remBtn) {
      remBtn.addEventListener("click", function () {
        syncStickerDesignerFromInputs();
        const key = st.activeKey || "sticker:0";
        if (!key.startsWith("sticker:")) return;
        if (st.stickerLayers.length <= 1) return;
        const idx = Number(key.split(":")[1] || 0);
        const layer = st.stickerLayers[idx];
        try { if (layer && layer.imageUrl && layer.imageUrl.startsWith("blob:")) URL.revokeObjectURL(layer.imageUrl); } catch(e){}
        st.stickerLayers.splice(idx, 1);
        st.activeKey = "sticker:" + Math.max(0, idx - 1);
        _renderLayerBar(true);
        _applyInputsFromActiveLayer();
        updateStikeri();
      });
    }

    // When background selection changes, make background layer reachable and keep editing sane.
    const bgSel = document.getElementById("stBackground");
    if (bgSel) {
      bgSel.addEventListener("change", function () {
        syncStickerDesignerFromInputs();
        // If background removed, ensure active is sticker.
        if (!_designerHasBackground() && st.activeKey === "background") st.activeKey = "sticker:0";
        _renderLayerBar(true);
        _applyInputsFromActiveLayer();
        updateStikeri();
      });
    }

    _renderLayerBar(false);
    _applyInputsFromActiveLayer();
  })();


  function _designerHasAnyWork(exceptIdx) {
    const st = _ensureDesignerState();
    const layers = Array.isArray(st.stickerLayers) ? st.stickerLayers : [];
    return layers.some(function(l, i){
      if (i === exceptIdx) return false;
      const hasText = !!String((l && (l.textRaw || l.text)) || '').trim();
      const hasImg = !!(l && l.imageUrl);
      return hasText || hasImg;
    }) || _designerHasBackground();
  }

  // Designer mode: Text vs Upload vs Assets (clean buttons)
  (function initDesignerMode() {
    const wrap = document.getElementById("designerMode");
    const hidden = document.getElementById("designMode");
    const textWrap = document.getElementById("stTextWrap");
    const fileWrap = document.getElementById("stFileWrap");
    const assetsWrap = document.getElementById("stAssetsWrap");
    const fileInput = document.getElementById("stFile");
    const textInput = document.getElementById("stText");
    if (!wrap || !hidden || !textWrap || !fileWrap) return;

    function setMode(mode) {
      let m = (mode === 'assets' || mode === 'upload' || mode === 'text') ? mode : 'text';
      const stCheck = _ensureDesignerState();
      const activeKeyCheck = stCheck.activeKey || 'sticker:0';
      const activeIdxCheck = String(activeKeyCheck).startsWith('sticker:') ? Number(String(activeKeyCheck).split(':')[1] || 0) || 0 : 0;
      const activeLayerCheck = stCheck.stickerLayers[activeIdxCheck];
      if (m === 'upload') {
        alert('Uploads accept only SVG / plain SVG files. Upload is available only before the design has active content.');
      }
      if (m === 'upload' && _designerHasAnyWork(activeIdxCheck) && !(activeLayerCheck && activeLayerCheck.imageUrl)) {
        m = 'text';
        const hint = document.getElementById('stFileHint');
        if (hint) hint.textContent = 'Upload is disabled after a design is started. Start fresh to upload an SVG.';
      }
      const isText = m === "text";
      const isUpload = m === 'upload';
      const isAssets = m === 'assets';

      hidden.value = m;
      // Persist mode into active sticker layer.
      const st = _ensureDesignerState();
      if (st.activeKey && st.activeKey.startsWith("sticker:")) {
        const idx = Number(st.activeKey.split(":")[1] || 0);
        if (st.stickerLayers[idx]) st.stickerLayers[idx].mode = m;
      }

      textWrap.style.display = isText ? "" : "none";
      fileWrap.style.display = isUpload ? "" : "none";
      if (assetsWrap) assetsWrap.style.display = isAssets ? "" : "none";

      // Required fields:
      if (textInput) textInput.required = isText;
      if (fileInput) fileInput.required = false;

      wrap.querySelectorAll(".segBtn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-mode") === m);
      });
      updateStikeri();
    }

    wrap.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest && e.target.closest(".segBtn");
      if (!btn) return;
      setMode(btn.getAttribute("data-mode") || "text");
    });

    // Default.
    setMode("text");
  })();



  // Assets library (curated SVGs)
  (function initAssetsLibrary(){
    const grid = document.getElementById('stAssetsGrid');
    const searchEl = document.getElementById('stAssetsSearch');
    const hintEl = document.getElementById('stAssetsHint');
    if (!grid) return;

    let catalog = [];

    function _getHashRouteAndQuery(){
      const raw = String(location.hash || '').replace(/^#/, '');
      const parts = raw.split('?');
      const route = (parts[0] || '').trim();
      const query = (parts[1] || '').trim();
      const params = {};
      if (query) {
        query.split('&').forEach(function(p){
          const kv = p.split('=');
          const k = decodeURIComponent((kv[0]||'').trim());
          const v = decodeURIComponent((kv[1]||'').trim());
          if (k) params[k] = v;
        });
      }
      return { route: route, params: params };
    }

    function _clearHashQueryKeepRoute(route){
      try {
        const clean = '#' + (route || 'design');
        if (location.hash === clean) return;
        history.replaceState(null, '', location.pathname + location.search + clean);
      } catch(e){
        location.hash = '#' + (route || 'design');
      }
    }

    async function addAssetToDesigner(item){
      if (!item) return;
      try {
        syncStickerDesignerFromInputs();
        const st = _ensureDesignerState();
        const maxL = _maxStickerLayers();
        let svgText = '';
        try { const rr = await fetch(item.svg); if (rr.ok) svgText = await rr.text(); } catch(e) {}
        let targetIdx = -1;
        const active = st.activeKey || 'sticker:0';
        if (String(active).startsWith('sticker:')) {
          const ai = Number(String(active).split(':')[1] || 0) || 0;
          const al = st.stickerLayers[ai];
          const empty = al && !String(al.textRaw || al.text || '').trim() && !al.imageUrl;
          if (empty) targetIdx = ai;
        }
        if (targetIdx < 0 && st.stickerLayers.length >= maxL) return;

        const newLayer = {
          mode: 'assets',
          assetId: item.id || '',
          textRaw: '',
          textFlow: (document.getElementById('stTextFlow') && document.getElementById('stTextFlow').value) || 'single',
          text: '',
          font: (document.getElementById('stFont') && document.getElementById('stFont').value) || 'Inter',
          color: (document.getElementById('stMainColor') && document.getElementById('stMainColor').value) || '#FFFFFF',
          imageUrl: item.svg,
          isSvg: true,
          offsetX: 0,
          offsetY: 0,
          rotationDeg: 0,
          scale: 1,
          widthCm: 10,
          svgText: svgText
        };
        if (targetIdx >= 0) st.stickerLayers[targetIdx] = newLayer;
        else { st.stickerLayers.push(newLayer); targetIdx = st.stickerLayers.length - 1; }

        window.__ST_PREVIEW_WHITE_BG_PREF__ = false;
        st.activeKey = 'sticker:' + targetIdx;

        // Switch UI to Assets mode for this layer.
        const hidden = document.getElementById('designMode');
        if (hidden) hidden.value = 'assets';
        const modeWrap = document.getElementById('designerMode');
        if (modeWrap) {
          modeWrap.querySelectorAll('.segBtn').forEach(function(b){
            b.classList.toggle('active', b.getAttribute('data-mode') === 'assets');
          });
        }

        _renderLayerBar(false);
        _applyInputsFromActiveLayer();
        updateStikeri();
      } catch(e) {}
    }

    function consumeAssetFromHashOnce(){
      try {
        const h = _getHashRouteAndQuery();
        if (h.route !== 'design') return;
        const assetId = h.params && h.params.asset ? String(h.params.asset).trim() : '';
        if (!assetId) return;
        const item = (Array.isArray(catalog) ? catalog : []).find(function(it){ return String(it.id) === assetId; });
        if (!item) return;
        addAssetToDesigner(item);
        _clearHashQueryKeepRoute('design');
      } catch(e) {}
    }

    function render(list){
      grid.innerHTML = '';
      if (!Array.isArray(list) || !list.length){
        if (hintEl) hintEl.textContent = 'No assets found.';
        return;
      }
      if (hintEl) hintEl.textContent = '';

      list.forEach(function(item){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'assetBtn';
        btn.setAttribute('data-svg', item.svg);
        btn.setAttribute('title', item.name || 'Asset');

        const img = document.createElement('img');
        img.alt = item.name || 'asset';
        img.src = item.svg;
        btn.appendChild(img);

        const name = document.createElement('div');
        name.className = 'assetName';
        name.textContent = item.name || item.id || 'Asset';
        btn.appendChild(name);

        btn.addEventListener('click', function(){
          addAssetToDesigner(item);
        });

        grid.appendChild(btn);
      });
    }

    function applyFilter(){
      const q = (searchEl && searchEl.value || '').trim().toLowerCase();
      if (!q) return render(catalog);
      const filtered = catalog.filter(function(it){
        const hay = [it.name, it.id, (it.tags||[]).join(' ')].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      render(filtered);
    }

    if (searchEl) searchEl.addEventListener('input', applyFilter);

    fetch('assets/catalog.json')
      .then(r => r.ok ? r.json() : [])
      .then(function(data){
        catalog = Array.isArray(data) ? data : [];
        render(catalog);
        // If navigated here with #design?asset=..., auto-insert it once.
        consumeAssetFromHashOnce();
      })
      .catch(function(){
        catalog = [];
        render(catalog);
      });

    // React when user clicks "Use in designer" on the Assets page.
    window.addEventListener('hashchange', consumeAssetFromHashOnce);
  })();


  // Assets page (website page that links into the designer)
  (function initAssetsPage(){
    const grid = document.getElementById('assetsPageGrid');
    const searchEl = document.getElementById('assetsPageSearch');
    const hintEl = document.getElementById('assetsPageHint');
    if (!grid) return;

    let catalog = [];

    function render(list){
      grid.innerHTML = '';
      if (!Array.isArray(list) || !list.length){
        if (hintEl) hintEl.textContent = 'No assets found.';
        return;
      }
      if (hintEl) hintEl.textContent = '';
      list.forEach(function(item){
        const card = document.createElement('div');
        card.className = 'assetCard';

        const top = document.createElement('div');
        top.className = 'assetCardTop';

        const img = document.createElement('img');
        img.alt = item.name || 'asset';
        img.src = item.svg;
        top.appendChild(img);

        const nm = document.createElement('div');
        nm.className = 'assetCardName';
        nm.textContent = item.name || item.id || 'Asset';
        top.appendChild(nm);

        card.appendChild(top);

        const actions = document.createElement('div');
        actions.className = 'assetCardActions';

        const use = document.createElement('a');
        use.href = '#design?asset=' + encodeURIComponent(item.id || '');
        use.textContent = 'Use in designer';
        actions.appendChild(use);

        const dl = document.createElement('a');
        dl.href = item.svg;
        dl.setAttribute('download', (item.id || 'asset') + '.svg');
        dl.textContent = 'Download';
        actions.appendChild(dl);

        card.appendChild(actions);

        grid.appendChild(card);
      });
    }

    function applyFilter(){
      const q = (searchEl && searchEl.value || '').trim().toLowerCase();
      if (!q) return render(catalog);
      const filtered = catalog.filter(function(it){
        const hay = [it.name, it.id, (it.tags||[]).join(' ')].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      render(filtered);
    }

    if (searchEl) searchEl.addEventListener('input', applyFilter);

    fetch('assets/catalog.json')
      .then(r => r.ok ? r.json() : [])
      .then(function(data){
        catalog = Array.isArray(data) ? data : [];
        render(catalog);
      })
      .catch(function(){
        catalog = [];
        render(catalog);
      });
  })();


  // Quantity presets + manual input
  (function initQtyPresets() {
    const presets = document.getElementById("stQtyPresets");
    const qtyInput = document.getElementById("stQty");
    if (!presets || !qtyInput) return;
    presets.addEventListener("click", function (e) {
      const b = e.target && e.target.closest && e.target.closest(".qtyBtn");
      if (!b) return;
      const q = Number(b.getAttribute("data-qty") || 5);
      qtyInput.value = String(q);
      presets.querySelectorAll(".qtyBtn").forEach(function (x) {
        x.classList.toggle("active", x === b);
      });
      updateStikeri();
    });
    qtyInput.addEventListener("input", function () {
      const v = Number(qtyInput.value || 0);
      presets.querySelectorAll(".qtyBtn").forEach(function (b) {
        b.classList.toggle("active", Number(b.getAttribute("data-qty")) === v);
      });
      updateStikeri();
    });
  })();

  const stLayerWidth = document.getElementById("stLayerWidth");
  if (stLayerWidth) {
    stLayerWidth.addEventListener("input", function(){
      try { syncStickerDesignerFromInputs(); updateStikeri(); _renderLayerBar(false); } catch(e) {}
    });
  }

  const stFile = document.getElementById("stFile");
  if (stFile) {
    stFile.addEventListener("change", function () {
      const st = _ensureDesignerState();
      const active = st.activeKey || "sticker:0";
      if (!active.startsWith("sticker:")) return;
      const idx = Number(active.split(":")[1] || 0);
      const layer = st.stickerLayers[idx];
      if (!layer) return;

      const file = stFile.files && stFile.files[0];
      if (!file) {
        if (layer.imageUrl && layer.imageUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(layer.imageUrl); } catch(e){}
        }
        layer.imageUrl = "";
        layer.isSvg = false;
        const sizeHint = document.getElementById("stSizeHint");
        const wEl = document.getElementById("stWidth");
        if (wEl) wEl.max = "60";
        if (sizeHint) sizeHint.textContent = "";
        return;
      }
      // Guardrail: keep uploads disciplined. For now allow SVG only (scales cleanly and avoids random raster quality).
      const isSvgByType = file.type === "image/svg+xml";
      const isSvgByName = /\.svg$/i.test(file.name || "");
      const isSvg = isSvgByType || isSvgByName;
      if (!isSvg) {
        const hint = document.getElementById("stFileHint");
        if (hint) {
          hint.textContent = "Only SVG files are allowed for uploads.";
          hint.classList.add('errorText');
        }
        stFile.value = "";
        if (layer.imageUrl && layer.imageUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(layer.imageUrl); } catch(e){}
        }
        layer.imageUrl = "";
        layer.isSvg = false;
        updateStikeri();
        return;
      }

      const reader = new FileReader();
      reader.onload = function(){
        const svgText = String(reader.result || '').trim();
        if (!/^<svg[\s>]/i.test(svgText.replace(/^<\?xml[^>]*>\s*/i, '').replace(/^<!doctype[^>]*>\s*/i, '')) || /<script[\s>]/i.test(svgText) || /on[a-z]+\s*=/i.test(svgText)) {
          const hint = document.getElementById("stFileHint");
          if (hint) {
            hint.textContent = "Only plain, safe SVG files are accepted. Remove scripts/embedded events and try again.";
            hint.classList.add('errorText');
          }
          stFile.value = "";
          return;
        }

            // Ensure the layer (and UI) is in upload mode so the preview renders the image.
      try {
        layer.mode = 'upload';
        // Keep this layer active so the user immediately sees/edits it.
        st.activeKey = 'sticker:' + idx;
        const hiddenMode = document.getElementById('designMode');
        if (hiddenMode) hiddenMode.value = 'upload';
        const modeWrap = document.getElementById('designerMode');
        if (modeWrap) {
          modeWrap.querySelectorAll('.segBtn').forEach(function(b){
            b.classList.toggle('active', b.getAttribute('data-mode') === 'upload');
          });
        }
      } catch(e){}

      // Basic quality guardrail + max size rules.
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        // For SVG, Image() often reports 0x0; we accept and render it anyway.
        const ok = true;
        const hint = document.getElementById("stFileHint");
        if (!ok) {
          if (hint) {
            hint.textContent = "This file is too small for clean printing. Please upload a higher-resolution image.";
            hint.classList.add('errorText');
          }
          stFile.value = "";
          if (layer.imageUrl && layer.imageUrl.startsWith("blob:")) {
            try { URL.revokeObjectURL(layer.imageUrl); } catch(e){}
          }
          layer.imageUrl = "";
          layer.isSvg = false;
          updateStikeri();
          return;
        }
        // SVG uploads can be larger; keep width max relaxed.
        const sizeHint = document.getElementById("stSizeHint");
        const wEl = document.getElementById("stWidth");
        if (wEl) wEl.max = "60";
        if (sizeHint) sizeHint.textContent = "SVG uploads scale cleanly and can be larger than A4.";

        if (hint) {
          hint.textContent = "Looks good.";
          hint.classList.remove('errorText');
        }
        // Save into current layer
        if (layer.imageUrl && layer.imageUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(layer.imageUrl); } catch(e){}
        }
        layer.imageUrl = url;
        layer.svgText = svgText;
        layer.isSvg = true;
        // SVG artwork is usually best previewed on white.
        // Force White BG ON when an SVG is uploaded (user can toggle off).
        window.__ST_PREVIEW_WHITE_BG_PREF__ = true;
        try {
          const box = document.getElementById('stPreviewBox');
          if (box) box.classList.add('whiteBgOn');
          const btn = document.getElementById('stWhiteBgToggle');
          if (btn) btn.classList.add('active');
        } catch(e) {}

        // Default rotation for newly uploaded artwork.
        if (!isFinite(Number(layer.rotationDeg))) layer.rotationDeg = 0;
        syncStickerDesignerFromInputs();
        updateStikeri();
        _renderLayerBar(false);
      };
      img.onerror = function () {
        const hint = document.getElementById("stFileHint");
        if (hint) {
          hint.textContent = "Could not read this file. Please try another image.";
          hint.classList.add('errorText');
        }
        stFile.value = "";
        if (layer.imageUrl && layer.imageUrl.startsWith("blob:")) {
          try { URL.revokeObjectURL(layer.imageUrl); } catch(e){}
        }
        layer.imageUrl = "";
        layer.isSvg = false;
        updateStikeri();
      };
      img.src = url;
      };
      reader.onerror = function(){
        const hint = document.getElementById("stFileHint");
        if (hint) hint.textContent = "Could not read SVG file.";
        stFile.value = "";
      };
      reader.readAsText(file);
    });
  }

  const backToCustom = document.getElementById("npBackToCustomBtn");
  if (backToCustom) {
    backToCustom.addEventListener("click", function () {
      _safe('setNadpisiMode', () => setNadpisiMode("custom"));
    });
  }

  const t = window.t || function(s) { return s; };
  const npCopy = document.getElementById("npCopy");
  if (npCopy) {
    npCopy.addEventListener("click", async function () {
      const ok = await copyText(buildNadpisiSummary());
      const hint = document.getElementById("npSubmitHint");
      if (hint) hint.textContent = ok ? (t("common.copied") || "📋 Copied!") : (t("common.copyError") || "❌ Could not copy.");
    });
  }
  const stCopy = document.getElementById("stCopy");
  if (stCopy) {
    stCopy.addEventListener("click", async function () {
      const ok = await copyText(buildStikeriSummary());
      const hint = document.getElementById("stSubmitHint");
      if (hint) hint.textContent = ok ? (t("common.copied") || "📋 Copied!") : (t("common.copyError") || "❌ Could not copy.");
    });
  }
  const avCopy = document.getElementById("avCopy");
  if (avCopy) {
    avCopy.addEventListener("click", async function () {
      const ok = await copyText(t("summary.avto") || "BG STICKERS • CUSTOM AUTO ORDER (see fields)");
      const hint = document.getElementById("avtoSubmitHint");
      if (hint) hint.textContent = ok ? (t("common.copied") || "📋 Copied!") : (t("common.copyError") || "❌ Could not copy.");
    });
  }
  const prCopy = document.getElementById("prCopy");
  if (prCopy) {
    prCopy.addEventListener("click", async function () {
      const ok = await copyText(t("summary.print") || "BG STICKERS • PRINT STICKER ORDER (see fields)");
      const hint = document.getElementById("printSubmitHint");
      if (hint) hint.textContent = ok ? (t("common.copied") || "📋 Copied!") : (t("common.copyError") || "❌ Could not copy.");
    });
  }

  const formNadpisi = document.getElementById("formNadpisi");
  if (formNadpisi) {
    formNadpisi.addEventListener("submit", function (e) {
      e.preventDefault();
      const type = window.NP_MODE === "popular" ? "nadpisi_popular" : "nadpisi_custom";
      postForm(
        formNadpisi,
        document.getElementById("npSubmitHint"),
        { type: type }
      );
    });
  }

  const formStikeri = document.getElementById("formStikeri");
  if (formStikeri) {
    formStikeri.addEventListener("submit", function (e) {
      e.preventDefault();
      postForm(
        formStikeri,
        document.getElementById("stSubmitHint"),
        { type: "stikeri_custom" }
      );
    });
  }

  const formAvto = document.getElementById("formAvtoCustom");
  if (formAvto) {
    formAvto.addEventListener("submit", function (e) {
      e.preventDefault();
      postForm(
        formAvto,
        document.getElementById("avtoSubmitHint"),
        { type: "avto_custom" }
      );
    });
  }

  const formPrint = document.getElementById("formPrint");
  if (formPrint) {
    formPrint.addEventListener("submit", function (e) {
      e.preventDefault();
      postForm(
        formPrint,
        document.getElementById("printSubmitHint"),
        { type: "print_sticker" }
      );
    });
  }

  // Reset the sticker designer to a clean start.
  (function initDesignerReset(){
    const btn = document.getElementById('stResetDesign');
    if (!btn) return;
    btn.addEventListener('click', function(){
      try{
        // Reset form inputs
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = String(v); };
        setVal('designMode', 'text');
        const modeWrap = document.getElementById('designerMode');
        if (modeWrap) modeWrap.querySelectorAll('.segBtn').forEach(b=>b.classList.toggle('active', b.getAttribute('data-mode')==='text'));

        setVal('stText', '');
        setVal('stTextFlow', 'single');
        const flowSingle = document.getElementById('stFlowSingle');
        const flowWords = document.getElementById('stFlowWords');
        if (flowSingle) flowSingle.classList.add('active');
        if (flowWords) flowWords.classList.remove('active');

        setVal('stWidth', 10);
        setVal('stQty', 50);
        setVal('stFinish', 'matte');
        setVal('stBackground', 'none');
        setVal('stBgScaleX', 110);
        setVal('stBgScaleY', 110);
        setVal('stBgFinish', 'matte');

        // Reset selects to first option when appropriate
        const stFont = document.getElementById('stFont');
        if (stFont) stFont.value = stFont.options && stFont.options.length ? (stFont.querySelector('option[selected]')?.value || stFont.options[0].value) : 'Inter';
        const stColor = document.getElementById('stMainColor');
        // Default text color should be white (keeps dark preview). Do not pick the first option because
        // some palettes put black first, which would force a white preview background.
        if (stColor) stColor.value = '#FFFFFF';
        const stBgColor = document.getElementById('stBgColor');
        if (stBgColor && stBgColor.options && stBgColor.options.length) stBgColor.value = stBgColor.options[0].value;

        // Clear upload
        const stFile = document.getElementById('stFile');
        if (stFile) stFile.value = '';
        const hint = document.getElementById('stFileHint');
        if (hint){ hint.textContent = ''; hint.classList.remove('errorText'); }

        // Reset internal state and revoke blobs
        if (window.ST_DESIGN_STATE && Array.isArray(window.ST_DESIGN_STATE.stickerLayers)){
          window.ST_DESIGN_STATE.stickerLayers.forEach(function(l){
            if (l && l.imageUrl && String(l.imageUrl).startsWith('blob:')){ try{ URL.revokeObjectURL(l.imageUrl); }catch(e){} }
          });
        }
        window.ST_DESIGN_STATE = null;
        _ensureDesignerState();
        _renderLayerBar(false);
        syncStickerDesignerFromInputs();
        updateStikeri();

        // Reset canvas view (pan/zoom)
        if (window.__ST_CANVAS__ && typeof window.__ST_CANVAS__.resetView === 'function') window.__ST_CANVAS__.resetView();
      }catch(e){
        // no-op
      }
    });
  })();

  // Initial previews.
  updateNadpisi();
  updateStikeri();
});

