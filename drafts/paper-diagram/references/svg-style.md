# SVG Backend Style Guide

SVG is the default backend for paper-diagram.  Use it when the user wants a
publication figure, LaTeX/Word paper asset, PDF, or SVG.  PPTX is only the
fallback when the user explicitly needs PowerPoint editability.

## Canvas

Default double-column canvas:

```xml
<svg width="1400" height="900" viewBox="0 0 1400 900"
     xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="900" fill="#FFFFFF"/>
  <!-- content -->
</svg>
```

Recommended widths:

| Paper target | SVG width | Typical height |
|--------------|-----------|----------------|
| Single column | 700 | 500-900 |
| Double column | 1400 | 700-1100 |
| Full page | 1700 | 1100-1700 |

Use integer coordinates.  Keep at least 60 units margin on a 1400-wide canvas.

## Banned SVG Features

Avoid features that break conversion, validation, or editability:

| Banned | Use instead |
|--------|-------------|
| `<style>` / `class` | Inline attributes (`fill`, `stroke`, `font-size`) |
| `style="…"` attributes | Explicit individual attributes |
| `<foreignObject>` | Native SVG `<text>`, `<rect>`, `<path>` |
| `<script>` / event attrs (`onclick`) | Not allowed |
| `<animate*>`, `<set>` | Static shapes only |
| `@font-face` | Installed font stack |
| HTML named entities (`&mdash;`) | Raw Unicode (`—`) |
| Bare `&`, `<`, `>` in text | XML entities: `&amp;`, `&lt;`, `&gt;` |

## Text

Use one logical line per `<text>`.  Use `<tspan>` only for inline emphasis or
manual line breaks.

```xml
<text x="260" y="175" text-anchor="middle"
      font-family="Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
      font-size="28" fill="#1A1A1A">Encoder</text>
```

Inline emphasis:

```xml
<text x="100" y="200" font-size="24" fill="#333333"
      font-family="Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif">
  Accuracy <tspan fill="#2E75B6" font-weight="700">+12%</tspan>
</text>
```

Multi-line text:

```xml
<text x="260" y="155" text-anchor="middle" font-size="24"
      font-family="Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif">
  <tspan x="260" dy="0">Feature</tspan>
  <tspan x="260" dy="32">Extractor</tspan>
</text>
```

Do not use `<tspan x="…">` to create same-line columns.  Use two `<text>`
elements for true columns.

## Semantic Roles

Default academic palette:

| Role | Fill | Border | Text |
|------|------|--------|------|
| primary | `#D6E4F0` | `#2E75B6` | `#1A1A1A` |
| secondary | `#FDE4C3` | `#ED7D31` | `#1A1A1A` |
| baseline | `#F5F5F5` | `#808080` | `#1A1A1A` |
| emphasis | `#505050` | `#303030` | `#FFFFFF` |
| success | `#D9ECD0` | `#5B9B4F` | `#1A1A1A` |
| warning | `#E6B8B7` | `#C0504D` | `#1A1A1A` |

Map semantic intent first.  Example: core contribution → primary; surrounding
baseline modules → baseline; loss/result highlight → emphasis.

## Boxes

```xml
<rect x="120" y="120" width="280" height="90" rx="16"
      fill="#D6E4F0" stroke="#2E75B6" stroke-width="3"/>
<text x="260" y="175" text-anchor="middle"
      font-family="Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
      font-size="28" fill="#1A1A1A">Encoder</text>
```

## Arrows

Connector arrows use `<marker>` with a closed triangle whose fill matches the
line stroke.

```xml
<defs>
  <marker id="arrowHead" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L10,5 L0,10 Z" fill="#404040"/>
  </marker>
</defs>
<line x1="400" y1="165" x2="520" y2="165"
      stroke="#404040" stroke-width="3" marker-end="url(#arrowHead)"/>
```

Always keep arrow endpoints padded away from box boundaries.  For horizontal
flows, start/end 20-30 units away from boxes unless tight layout forces less.

## Groups

Use a background rectangle with dashed border, then place child elements inside.
Leave at least 70 units from the top edge for the group label.

```xml
<rect x="80" y="340" width="1260" height="360" rx="20"
      fill="#FAFAFA" stroke="#808080" stroke-width="2" stroke-dasharray="8 8"/>
<text x="110" y="385" font-size="24" font-weight="700"
      font-family="Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
      fill="#505050">Details</text>
```

## QA Checklist

Before exporting:

- Root `<svg>` has width, height, viewBox, and namespace.
- First visible child is full-canvas white background.
- No banned tags or attributes.
- All text has explicit `font-family` and readable size.
- Arrows have visible line and marker head.
- No element overlaps text unless intentional.
- Canvas margins are consistent.
