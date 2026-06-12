// Pricing rules and helpers.

function basePriceByWidth(widthCm) {
  const w = Number(widthCm || 0);
  if (w <= 10) return 10;
  if (w <= 50) return 15;
  if (w <= 100) return 17;
  if (w <= 150) return 20;
  if (w <= 200) return 20;
  return 20;
}

function estimatePrice(opts) {
  const widthCm = opts && opts.widthCm;
  const extraColorsCount = (opts && opts.extraColorsCount) || 0;
  const extraBase = (opts && opts.extraBase) || 0;
  const base = basePriceByWidth(widthCm) + extraBase;
  const extra = Math.max(0, extraColorsCount) * 3;
  return { base: base, extra: extra, total: base + extra };
}

// Sticker Designer pricing (text/upload stickers): includes size + quantity with sane volume discounts.
// Goals:
// - Never becomes "insanely cheap" at high qty/size
// - Simple, transparent estimate for users
// - Enforces minimum charge
function estimateStickerDesignerPrice(opts) {
  const widthCm = Number((opts && opts.widthCm) || 10);
  const qty = Math.max(1, Number((opts && opts.qty) || 5));
  const finish = String((opts && opts.finish) || "matte");
  const bg = String((opts && opts.background) || "none");
  const bgFinish = String((opts && opts.backgroundFinish) || "matte");
  const extraStickerLayers = Math.max(0, Number((opts && opts.extraStickerLayers) || 0));

  const q = Math.max(5, qty); // pricing minimum

  // Size drives material + time. Use a gentle quadratic term so big sizes don't get unrealistically cheap.
  // (We only have a width input, so this is an approximation for area/coverage.)
  const w = Math.max(5, Math.min(60, widthCm));
  const sizeLin = 0.06 * w;
  const sizeQuad = 0.0009 * w * w; // kicks in for large sizes

  // Setup fee: baseline + size + optional background + extra layers.
  const setup = 5.50 + sizeLin * 0.9 + (bg !== "none" ? 2.25 : 0) + extraStickerLayers * 1.25;

  const finishUnitAdd = finish === "holo" ? 0.55 : finish === "glossy" ? 0.20 : 0;
  const bgUnitAdd = bg !== "none" ? 0.18 : 0;
  const bgFinishUnitAdd = bg !== "none" ? (bgFinish === "holo" ? 0.32 : bgFinish === "glossy" ? 0.12 : 0) : 0;

  // Base unit price.
  let unit = 0.65 + sizeLin + sizeQuad + finishUnitAdd + bgUnitAdd + bgFinishUnitAdd;

  // Extra sticker layers cost: additional print/cut complexity.
  // (Background is handled separately; this is for additional sticker layers beyond the first.)
  if (extraStickerLayers > 0) {
    const layerUnit = (0.28 + 0.012 * w) * extraStickerLayers;
    unit += layerUnit;
  }

  // Volume discount (capped; never goes below 0.55).
  let discount = 1;
  if (q >= 25) discount = 0.92;
  if (q >= 50) discount = 0.86;
  if (q >= 100) discount = 0.80;
  if (q >= 250) discount = 0.74;
  if (q >= 500) discount = 0.69;
  if (q >= 1000) discount = 0.64;
  discount = Math.max(0.55, discount);

  unit = unit * discount;

  // Guardrail minimum per-unit based on size (prevents "very big" + "very high qty" from being silly).
  const minUnit = 0.55 + 0.035 * w + (extraStickerLayers > 0 ? 0.10 * extraStickerLayers : 0);
  unit = Math.max(unit, minUnit);

  let total = setup + unit * q;
  // Global minimum charge.
  total = Math.max(total, 12.90);

  return {
    unit: unit,
    setup: setup,
    qtyPriced: q,
    total: total
  };
}

