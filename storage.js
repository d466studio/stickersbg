// Storage & config helpers: colors, fetch wrappers, global CONFIG.

const CONFIG = {
  brandName: "stickers.studio",
  instagram: "@stickers.studio",
  formEndpoint: "", // optional: Formspree/Getform endpoint
  contactEmail: "you@example.com"
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
  const json = await safeFetchJson("colors.json");
  return Array.isArray(json) && json.length ? json : FALLBACK_COLORS;
}

