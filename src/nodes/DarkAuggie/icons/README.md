# Dark Auggie Icon Variants

This folder contains multiple SVG explorations for the Dark Auggie icon. All assets are pure SVG (no raster), designed to be legible at 16px/24px/32px and scalable up.

Files
- dark-auggie-v1-badge.svg — Badge Minimal
- dark-auggie-v2-visor.svg — Visor Emphasis
- dark-auggie-v3-core-glow.svg — Core Glow (candidate)
- dark-auggie-v4-glyph.svg — Glyph only (no plate)
- dark-auggie-v5-legible.svg — Legible plate + wider core (FINAL)
- dark-auggie-v6-tiny.svg — Tiny-size optimized glyph (no plate)
- dark-auggie-v7-outline.svg — Outline-forward glyph (no plate)

Final icon (used by the node)
- ../../DarkAuggie/dark-auggie.svg — now references the v5 "Legible" treatment

Preview locally
- macOS Finder: press space on a file to quick-look
- Or open in any browser directly
- Or use: `python3 -m http.server` from repo root, then visit http://localhost:8000/src/nodes/DarkAuggie/icons/

Legibility notes
- Maintain a clear A silhouette with subtle Sith-helmet cues
- Keep Augment-green (#3D855E .. #2F6A4A) as the glowing core
- Prefer thicker core (14px at 256 canvas) and 1.5px silhouette stroke for clarity
- Avoid tiny decorative elements that blur at small sizes; use v6 at 16–20px, v5 at 24px+, v7 on light/flat backgrounds
