# stickers.studio (preview build)

## Run locally
Because this is a static site, you can run it with any local web server.

### Option A (Python)
```bash
python3 -m http.server 8080
```
Open: http://localhost:8080

### Option B (Node)
```bash
npx serve .
```

## What changed in this build
- Rebranded **BG STICKERS → stickers.studio**
- Accent color locked to **Signature Purple #8B5CF6**
- Minimalistic UI refresh (black/white, editorial spacing)
- **Custom** is now **DESIGN**: the sticker designer is the main entry point
- Designer guardrails:
  - Text mode: max **2 lines**, **20 chars/line**
  - Upload mode: blocks very small images (< 800×800)
  - No font uploads (strict font list)
  - Added Shape / Finish / Quantity
- Added a placeholder **SHOP** page (coming soon)

