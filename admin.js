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

function clearLocalOverride() {
  localStorage.removeItem("vinyl_colors_override");
}

function rowTemplate(color, idx) {
  return `
    <div class="itemCard" data-idx="${idx}" style="display:flex;gap:10px;align-items:center">
      <div class="swatch" style="background:${color.hex};width:28px;height:28px" title="${escapeHtml(color.name)}"></div>

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

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function collectColors(editorEl) {
  const rows = [...editorEl.querySelectorAll(".itemCard")];
  return rows.map(r => {
    const name = r.querySelector(".cName").value.trim();
    const hex = r.querySelector(".cHex").value.trim();
    return { name, hex };
  }).filter(c => c.name && c.hex);
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

  // Live swatch update on input
  editorEl.querySelectorAll(".cHex, .cName").forEach(inp => {
    inp.addEventListener("input", () => {
      const updated = collectColors(editorEl);
      colors.splice(0, colors.length, ...updated);
      renderEditor(editorEl, colors);
      refreshExport(colors);
    });
  });
}

function refreshExport(colors) {
  document.getElementById("exportBox").value = JSON.stringify(colors, null, 2);
}

// ---------------------
// Password gate (client-side)
// ---------------------
function isAuthed() {
  return sessionStorage.getItem("admin_authed") === "1";
}

function setAuthed() {
  sessionStorage.setItem("admin_authed", "1");
}

function showPanel() {
  document.getElementById("adminGate").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
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
    hint.textContent = "✅ Запазено локално. За публично: Export → обнови colors.json в GitHub.";
    refreshExport(updated);
  });

  document.getElementById("btnClearLocal").addEventListener("click", () => {
    clearLocalOverride();
    hint.textContent = "🧹 Локалният override е изчистен. Сайтът ще използва colors.json.";
  });

  document.getElementById("btnExport").addEventListener("click", () => {
    refreshExport(collectColors(editor));
    hint.textContent = "📦 Export готов. Копирай текста и замени colors.json в GitHub repo.";
  });

  document.getElementById("btnImport").addEventListener("click", () => {
    try {
      const txt = document.getElementById("exportBox").value;
      const imported = JSON.parse(txt);
      if (!Array.isArray(imported)) throw new Error("Not array");
      colors.splice(0, colors.length, ...imported);
      renderEditor(editor, colors);
      hint.textContent = "✅ Import OK. Запази локално или export за GitHub.";
    } catch (e) {
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

  // already authed in this tab session
  if (isAuthed()) {
    showPanel();
    initPanel();
  }
})();
