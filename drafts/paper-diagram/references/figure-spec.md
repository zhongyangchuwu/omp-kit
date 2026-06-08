# Figure Spec Intermediate Format

Every paper-diagram job starts by converting the user's input into a small,
explicit figure specification.  The input may be an image, a text description,
or both.  SVG and PPTX backends both generate from this spec rather than from
raw prose.

## Required Sections

```yaml
canvas:
  target: double-column-paper     # single-column-paper | double-column-paper | full-page
  width: 1400                     # SVG units; use 1400 for double column by default
  height: 900                     # derive from content; keep enough whitespace
  background: "#FFFFFF"

style:
  palette: academic-blue          # semantic palette name, not arbitrary colors
  font_family: "Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
  roles:
    primary:   { fill: "#D6E4F0", border: "#2E75B6", text: "#1A1A1A" }
    secondary: { fill: "#FDE4C3", border: "#ED7D31", text: "#1A1A1A" }
    baseline:  { fill: "#F5F5F5", border: "#808080", text: "#1A1A1A" }
    emphasis:  { fill: "#505050", border: "#303030", text: "#FFFFFF" }

elements:
  - id: encoder
    type: box                     # box | group | circle | diamond | label | icon | custom
    role: primary
    text: Encoder
    position: { row: 0, col: 0 }
    size: { w: 260, h: 90 }

connections:
  - from: encoder
    to: decoder
    direction: right              # right | left | down | up | custom
    label: null
    role: baseline
```

## Rules

- Use stable lowercase IDs (`encoder`, `loss_head`, `stage_1`), never display
  text as an ID.
- Use semantic color roles (`primary`, `baseline`) before raw colors.
- Represent layout intent (`row`, `col`, `group`, `below`, `right-of`) before
  absolute coordinates.  The backend may convert intent to coordinates.
- Connections must name `from` and `to` element IDs; do not describe arrows only
  in prose.
- If a connection must not touch shapes, specify `padding` or rely on backend
  defaults.

## Text-Spec Path

When the user gives a text-only diagram description, first produce the spec.
Do not ask for an image.  Ask clarifying questions only when these are missing:

1. approximate number of elements;
2. main flow direction;
3. which element is the contribution or focus;
4. whether nested groups are required.

## Vision Path

When the user provides a source image, inspect it and fill the same fields:
canvas, style, elements, and connections.  If exact colors are not critical,
map them to semantic roles rather than copying every RGB value.
