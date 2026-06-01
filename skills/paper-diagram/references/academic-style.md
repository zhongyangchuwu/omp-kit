# Academic Paper Diagram Style Specification

Constraints for publication-quality figures. Apply these unless the
original image has a clearly different convention that must be preserved.

## Canvas Dimensions

| Context | Width | Max Height | Typical Aspect |
|---------|-------|------------|----------------|
| Single column (IEEE/ACM/Elsevier) | 3.5 in (89 mm) | 4.5 in | 3:4 |
| Double column / full text width | 7.0 in (178 mm) | 8.0 in | ~7:5 |
| Full page (dedicated figure page) | 8.5 in (216 mm) | 9.0 in | ~1:1 |

Derive height from the original image's aspect ratio. Clamp to the max.
Prefer double-column width unless the diagram is narrow and simple.

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Box labels (primary) | Arial / Helvetica | 9-10 pt | Bold | Sans-serif for readability |
| Box body text | Arial / Helvetica | 8-9 pt | Regular | Multi-line within boxes |
| Edge/arrow labels | Arial / Helvetica | 7-8 pt | Regular | Smaller than box text |
| Section headers | Arial / Helvetica | 11-12 pt | Bold | For grouped regions |
| Caption numbers | Arial / Helvetica | 8 pt | Bold | (a), (b), ①, ② markers |
| Monospace (code/paths) | Consolas / Courier New | 7.5-8 pt | Regular | For code snippets in diagrams |

- Font size must be ≥ 7 pt — smaller is illegible in print.
- Declare `font-size: 8pt` via `Pt(8)`.
- Do not use font names that are unlikely to be installed (e.g., "CustomFont").
  Stick to Arial, Helvetica, Times New Roman, or Consolas.

## Color Palette

Prefer grayscale-safe colors. Figures are often printed in B&W or viewed
by colorblind readers. Use lightness contrast, not just hue contrast.

### Grayscale-Safe Palette (recommended default)

| Role | Hex | RGB | Use |
|------|-----|-----|-----|
| Primary fill | `#E8E8E8` | (232,232,232) | Box background (light) |
| Secondary fill | `#D0D0D0` | (208,208,208) | Alternate box / group bg |
| Accent fill | `#B0B0B0` | (176,176,176) | Emphasis box / header bar |
| Dark fill | `#505050` | (80,80,80) | Dark box (white text inside) |
| Border | `#404040` | (64,64,64) | Shape borders, connector lines |
| Text (dark bg) | `#FFFFFF` | (255,255,255) | Text on dark fills |
| Text (light bg) | `#1A1A1A` | (26,26,26) | Body text (near-black, not pure black) |

### Color-Safe Palette (when color is essential)

| Role | Hex | RGB | Use |
|------|-----|-----|-----|
| Blue fill | `#D6E4F0` | (214,228,240) | Primary box |
| Orange fill | `#FDE4C3` | (253,228,195) | Secondary / contrasting box |
| Green fill | `#D9ECD0` | (217,236,208) | Success / positive |
| Red accent | `#E6B8B7` | (230,184,183) | Warning / negative |
| Blue border | `#2E75B6` | (46,117,182) | Blue box border |
| Orange border | `#ED7D31` | (237,125,49) | Orange box border |
| Text | `#1A1A1A` | (26,26,26) | Body text |

### Rules

- Maximum 5-6 distinct colors. More = visual noise.
- One color should dominate (≥ 60% of colored area).
- Borders are always darker than the fill of the same hue.
- Use `RGBColor(r, g, b)` — never hex strings in python-pptx.
- Test: if you print the figure on a B&W printer, can you still distinguish
  all elements?

## Line Weights

| Element | Weight | Notes |
|---------|--------|-------|
| Box borders | 1.0–1.5 pt | `Pt(1.0)` default |
| Connector lines (arrows) | 1.0–1.5 pt | Match box border weight |
| Emphasis borders | 2.0–2.5 pt | For key boxes only |
| Separating lines / dividers | 0.75 pt | Thinner than box borders |
| Dashed lines (optional flow) | 1.0 pt, dash style | Use sparingly |

## Spacing

| Context | Value | Notes |
|---------|-------|-------|
| Box internal padding | 0.08–0.12 in | Left/right margins inside shape |
| Gap between adjacent boxes | 0.12–0.20 in | Horizontal or vertical |
| Arrow head size | auto (python-pptx default) | Do not override unless misaligned |
| Text margin within shape | 0.05–0.08 in | Use `shape.text_frame.margin_left` etc. |
| Page margin | 0.25–0.50 in | From slide edges to nearest element |

- Be consistent: pick one gap value and use it everywhere.
- Do not crowd: if elements touch, insert at least a 0.05 in gap.

## Shapes

| Diagram Element | MSO_SHAPE | Notes |
|-----------------|-----------|-------|
| Standard box | `ROUNDED_RECTANGLE` | Default for flowchart nodes |
| Sharp box | `RECTANGLE` | For data stores, strict containers |
| Decision diamond | `DIAMOND` | For conditional branches |
| Circle / ellipse | `OVAL` | For start/end, entities |
| Down arrow | `DOWN_ARROW` | Vertical flow indicator |
| Right arrow | `RIGHT_ARROW` | Horizontal flow indicator |
| Document | `WAVE` or custom rect | For data sources |
| Database cylinder | Custom (rounded rect + arc) | Or use `CYLINDER` if available |

## Export

- PDF target: `soffice --headless --convert-to pdf output.pptx`
- 300 DPI minimum for raster elements, but prefer all-vector output.
- The PDF is the deliverable. PPTX is the editable intermediate.
