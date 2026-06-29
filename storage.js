// Storage & config helpers: colors, fetch wrappers, global CONFIG.

const CONFIG = {
  brandName: "stickers.studio",
  instagram: "@stickers.studio",
  formEndpoint: "https://formsubmit.co/pavel_kolarov@yahoo.com", // static-site order endpoint
  contactEmail: "pavel_kolarov@yahoo.com"
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

