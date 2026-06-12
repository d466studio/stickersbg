const ADMIN_PASSWORD = "350350";

async function loadBaseColors() {
  const res = await fetch("colors.json", { cache: "no-store" });
  return await res.json();
}

function loadLocalOverride() {
  const ls = localStorage.getItem("vinyl_colors_override");
  if (!ls) return null;
  try { return JSON.parse(ls); } catch { return null; }
}

function saveLocalOverride(colors) {
  localStorage.setItem("vinyl_colors_override", JSON.stringify(colors, null, 2));
}
function clearLocalOverride() { localStorage.removeItem("vinyl_colors_override"); }

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function rowTemplate(color, idx) {
  return `
    <div class="itemCard" data-idx="${idx}" style="display:flex;gap:10px;align-items:center">
      <div class="swatch" style="background:${escapeHtml(color.hex)};width:28px;height:28px" title="${escapeHtml(color.name)}"></div>

      <div style="flex:1;display:grid;grid-template-columns: 1fr 1fr;gap:10px">
        <label style="margin:0">
          Име
          <input type="text" class="cName" value="${escapeHtml(color.name)}" />
        </label>
        <label style="margin:0">
          HEX
          <input type="text" class="cHex" value="${escapeHtml(color.hex)}" />
        </label>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn" data-act="up" title="Нагоре">↑</button>
        <button class="btn" data-act="down" title="Надолу">↓</button>
      </div>

      <button class="btn" data-act="del" title="Изтрий">✕</button>
    </div>
  `;
}

function collectColors(editorEl) {
  const rows = [...editorEl.querySelectorAll(".itemCard")];
  return rows.map(r => {
    const name = r.querySelector(".cName").value.trim();
    const hex = r.querySelector(".cHex").value.trim();
    return { name, hex };
  }).filter(c => c.name && c.hex);
}

function refreshExport(colors) {
  document.getElementById("exportBox").value = JSON.stringify(colors, null, 2);
}

function renderEditor(editorEl, colors) {
  editorEl.innerHTML = colors.map((c,i)=>rowTemplate(c,i)).join("");

  editorEl.querySelectorAll("button[data-act]").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      const card = btn.closest(".itemCard");
      const idx = Number(card.dataset.idx);

      if (act === "del") {
        colors.splice(idx, 1);
      } else if (act === "up" && idx > 0) {
        [colors[idx-1], colors[idx]] = [colors[idx], colors[idx-1]];
      } else if (act === "down" && idx < colors.length-1) {
        [colors[idx+1], colors[idx]] = [colors[idx], colors[idx+1]];
      }
      renderEditor(editorEl, colors);
      refreshExport(colors);
    });
  });

  editorEl.querySelectorAll(".cHex, .cName").forEach(inp => {
    inp.addEventListener("input", () => {
      const updated = collectColors(editorEl);
      colors.splice(0, colors.length, ...updated);
      renderEditor(editorEl, colors);
      refreshExport(colors);
    });
  });
}

function isAuthed() { return sessionStorage.getItem("admin_authed") === "1"; }
function setAuthed() { sessionStorage.setItem("admin_authed", "1"); }

function showPanel() {
  document.getElementById("adminGate").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  const f = document.getElementById("adminFonts");
  if (f) f.style.display = "block";
}

async function initPanel() {
  const hint = document.getElementById("adminHint");
  const editor = document.getElementById("colorEditor");

  const base = await loadBaseColors();
  const local = loadLocalOverride();
  const colors = local || base;

  renderEditor(editor, colors);
  refreshExport(colors);

  document.getElementById("btnAdd").addEventListener("click", () => {
    colors.push({ name: "Нов цвят", hex: "#ffffff" });
    renderEditor(editor, colors);
    refreshExport(colors);
  });

  document.getElementById("btnSaveLocal").addEventListener("click", () => {
    const updated = collectColors(editor);
    saveLocalOverride(updated);
    hint.textContent = "✅ Запазено локално. Export → обнови colors.json в GitHub за публично.";
    refreshExport(updated);
  });

  document.getElementById("btnClearLocal").addEventListener("click", () => {
    clearLocalOverride();
    hint.textContent = "🧹 Локалният override е изчистен (ще се ползва colors.json).";
  });

  document.getElementById("btnExport").addEventListener("click", () => {
    refreshExport(collectColors(editor));
    hint.textContent = "📦 Export готов. Копирай и замени colors.json в GitHub repo.";
  });

  document.getElementById("btnImport").addEventListener("click", () => {
    try {
      const txt = document.getElementById("exportBox").value;
      const imported = JSON.parse(txt);
      if (!Array.isArray(imported)) throw new Error("Not array");
      colors.splice(0, colors.length, ...imported);
      renderEditor(editor, colors);
      hint.textContent = "✅ Import OK. Запази локално или export за GitHub.";
    } catch {
      hint.textContent = "❌ Невалиден JSON.";
    }
  });
}

(function init(){
  const gateHint = document.getElementById("gateHint");
  const pass = document.getElementById("adminPass");
  const btn = document.getElementById("btnLogin");

  const attempt = async () => {
    if ((pass.value || "").trim() === ADMIN_PASSWORD) {
      setAuthed();
      showPanel();
      await initPanel();
    } else {
      gateHint.textContent = "❌ Грешна парола.";
      pass.value = "";
      pass.focus();
    }
  };

  btn.addEventListener("click", attempt);
  pass.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attempt();
  });

  if (isAuthed()) {
    showPanel();
    initPanel();
  }
})();


// --- Fonts: stored locally in IndexedDB so they appear in the designer font dropdown (this browser) ---
const FONT_DB_NAME = "bg_stickers_fonts";
const FONT_DB_VERSION = 1;
const FONT_STORE = "fonts";

function openFontDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FONT_DB_NAME, FONT_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FONT_STORE)) {
        db.createObjectStore(FONT_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function fontIdFromFile(file) {
  const base = (file && file.name ? file.name : "font").replace(/\.[^.]+$/, "");
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
}

function normalizeFamilyName(name) {
  const n = String(name || "").trim();
  if (!n) return "";
  // Title-case-ish while keeping acronyms
  return n.split(/\s+/).map(w => w.length <= 3 ? w.toUpperCase() : (w[0].toUpperCase()+w.slice(1))).join(" ");
}

async function saveFontToDB(font) {
  const db = await openFontDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, "readwrite");
    tx.objectStore(FONT_STORE).put(font);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllFontsFromDB() {
  const db = await openFontDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, "readonly");
    const req = tx.objectStore(FONT_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFontFromDB(id) {
  const db = await openFontDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, "readwrite");
    tx.objectStore(FONT_STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function bufferFromFile(file) {
  return await file.arrayBuffer();
}

async function initFontAdmin() {
  const listEl = document.getElementById("fontList");
  const nameEl = document.getElementById("fontName");
  const fileEl = document.getElementById("fontFile");
  const btn = document.getElementById("btnAddFont");
  const hint = document.getElementById("fontHint");
  if (!listEl || !fileEl || !btn) return;

  async function refresh() {
    const fonts = await loadAllFontsFromDB();
    listEl.innerHTML = "";
    if (!fonts.length) {
      listEl.innerHTML = '<p class="muted">Няма качени шрифтове.</p>';
      return;
    }
    fonts.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    fonts.forEach(f => {
      const row = document.createElement("div");
      row.className = "itemCard";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "10px";
      row.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="font-weight:700">${escapeHtml(f.family || "Font")}</div>
          <div class="muted small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(f.fileName || "")}</div>
        </div>
        <button class="btn" type="button" data-del="${escapeHtml(f.id)}">Delete</button>
      `;
      listEl.appendChild(row);
    });
  }

  listEl.addEventListener("click", async (e) => {
    const btn = e.target && e.target.closest && e.target.closest("button[data-del]");
    if (!btn) return;
    const id = btn.getAttribute("data-del");
    await deleteFontFromDB(id);
    await refresh();
  });

  btn.addEventListener("click", async () => {
    const file = fileEl.files && fileEl.files[0];
    if (!file) { if (hint) hint.textContent = "Избери файл."; return; }
    const ok = /\.(ttf|otf|woff|woff2)$/i.test(file.name);
    if (!ok) { if (hint) hint.textContent = "Моля качи TTF/OTF/WOFF/WOFF2."; return; }
    const customName = normalizeFamilyName(nameEl && nameEl.value);
    const family = customName || normalizeFamilyName(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g," "));
    try {
      if (hint) hint.textContent = "Качване…";
      const buffer = await bufferFromFile(file);
      await saveFontToDB({ id: fontIdFromFile(file), family, fileName: file.name, mime: file.type, buffer, savedAt: Date.now() });
      if (hint) hint.textContent = "✅ Добавен: " + family;
      if (nameEl) nameEl.value = "";
      fileEl.value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      if (hint) hint.textContent = "Грешка при запис. Опитай отново.";
    }
  });

  await refresh();
}

