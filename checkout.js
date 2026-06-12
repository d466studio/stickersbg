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
    (t("summary.description") || "Notes: ") +
    (desc || "-") + "\n" +
    (t("summary.price") || "Price (est.): ") +
    price
  );
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

