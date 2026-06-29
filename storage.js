// Storage & config helpers: colors, fetch wrappers, global CONFIG.

const CONFIG = {
  brandName: "stickers.studio",
  instagram: "@stickers.studio.bg",
  contactEmail: "pavel_kolarov@yahoo.com",

  // ── Web3Forms (backendless email) ────────────────────────────────────────
  // 1. Go to https://web3forms.com and sign up with your owner email.
  // 2. Copy the access_key from your dashboard and paste it below.
  // 3. Your email address is NEVER exposed in frontend code — only this key.
  // 4. Free tier: 250 submissions / month. No redirect. No email visible.
  web3formsKey: "504908b1-9c88-400c-a9c2-3afe1f10f5fe",

  // Legacy fallback (used only if web3formsKey is not set)
  formEndpoint: "https://formsubmit.co/pavel_kolarov@yahoo.com"
};

const FALLBACK_COLORS = [
  { name: "Черно", hex: "#0F1014" },
  { name: "Бяло", hex: "#FFFFFF" },
  { name: "Лилаво", hex: "#8B5CF6" },
  { name: "Червено", hex: "#ff3b30" },
  { name: "Синьо", hex: "#2f80ed" },
  { name: "Зелено", hex: "#27ae60" }
];

async function safeFetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(path + " " + res.status);
    return await res.json();
  } catch {
    return null;
  }
}

async function loadColors() {
  const ls = localStorage.getItem("vinyl_colors_override");
  if (ls) {
    try {
      return JSON.parse(ls);
    } catch {
      // ignore corrupted local override
    }
  }
  // fetch() is blocked over file://, so use the embedded mirror (colors-data.js)
  // when the page is opened directly. Over http we fetch the canonical colors.json.
  if (location.protocol === "file:" && Array.isArray(window.COLORS_DB) && window.COLORS_DB.length) {
    return window.COLORS_DB;
  }
  const json = await safeFetchJson("colors.json");
  if (Array.isArray(json) && json.length) return json;
  if (Array.isArray(window.COLORS_DB) && window.COLORS_DB.length) return window.COLORS_DB;
  return FALLBACK_COLORS;
}

