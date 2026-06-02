---
name: paper-diagram
description: >
  Create publication-ready academic diagrams from an image or text description.
  Default backend is SVG for paper figures, LaTeX/Word assets, and PDF export.
  Use the PPTX backend only when the user explicitly needs an editable
  PowerPoint file. Single-diagram focus — not for multi-slide presentations.
---

# Paper Diagram Skill

Create clean academic diagrams from either a source image or a text layout
specification.  The default path is **SVG-first** because paper figures want
vector PDF/SVG output, fast browser preview, and precise arrows/labels.  The
PPTX backend remains available only when PowerPoint editability matters.

## When to Use

Use this skill when:

- the user provides an image and asks to "redraw", "remake", "convert for paper",
  "make clean version", or "export as PDF for publication";
- the user provides a text description of a diagram layout and wants it built
  from scratch;
- the image/description is a flowchart, architecture diagram, pipeline figure,
  data-flow diagram, comparison figure, method overview, or annotated schematic;
- the user mentions "paper figure", "论文用图", "学术图表", "publication-ready",
  "LaTeX", "SVG", or "PDF figure".

Do not use this skill when:

- the user wants a full slide deck or multi-page presentation (use ppt-master);
- the image is a photograph or photograph-like rendering;
- the task is purely text extraction or format conversion;
- the user wants to edit an existing PPTX file.

## Dependencies

Python:

```bash
pip install python-pptx Pillow
```

System:

- `rsvg-convert` preferred for SVG → PDF;
- LibreOffice (`soffice`) fallback for SVG/PPTX → PDF;
- Poppler (`pdftoppm`) for PDF → JPG preview.

## Workflow

### Phase 0: Input Gate

Check what the user provided and choose the input path:

| Input | Action |
|-------|--------|
| Text-only diagram description | Build Figure Spec directly |
| Source image | Inspect image, then build Figure Spec |
| Source image + text instructions | Inspect image; use text as constraints |

Ask clarifying questions only when critical information is missing:

1. approximate number of elements;
2. main flow direction;
3. which element is the core contribution;
4. whether nested groups/containers are required.

Otherwise proceed.

### Phase 1: Figure Spec

Convert the input into the intermediate spec described in
`references/figure-spec.md`.  Do not draw directly from raw prose.

Minimum spec fields:

```yaml
canvas:
  target: double-column-paper
  width: 1400
  height: 900
  background: "#FFFFFF"
style:
  palette: academic-blue
  font_family: "Arial, Microsoft YaHei, Noto Sans CJK SC, sans-serif"
elements:
  - id: encoder
    type: box
    role: primary
    text: Encoder
    position: { row: 0, col: 0 }
connections:
  - from: encoder
    to: decoder
    direction: right
```

For image input, inspect every visible element.  Cover boxes, arrows, labels,
icons, groups, and color roles.  For text input, infer the same fields from the
user's description.

### Phase 2: Backend Gate

Choose output backend:

| User goal | Backend |
|-----------|---------|
| paper figure, PDF, SVG, LaTeX/Word asset, fast iteration | **SVG backend (default)** |
| explicitly needs editable PowerPoint / manual PPT adjustment | PPTX backend |

If the user does not specify a backend, use SVG.

### Phase 2A: SVG Backend (Default)

Read `references/svg-style.md`.  Generate a standalone SVG file from the Figure
Spec.  Use integer coordinates, semantic role colors, explicit font family, and
inline attributes only.

Required SVG skeleton:

```xml
<svg width="1400" height="900" viewBox="0 0 1400 900"
     xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="900" fill="#FFFFFF"/>

  <defs>
    <marker id="arrowHead" markerWidth="10" markerHeight="10"
            refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 Z" fill="#404040"/>
    </marker>
  </defs>

  <!-- content -->
</svg>
```

SVG rules:

- Use `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<path>`, `<polygon>`, and
  `<text>` only unless the style guide allows more.
- Use `marker-end="url(#arrowHead)"` for connector arrows.
- Keep arrow endpoints padded away from boxes.
- Use one logical line per `<text>`; use `<tspan>` for line breaks or inline
  emphasis.
- Escape XML-reserved characters: `&amp;`, `&lt;`, `&gt;`.
- Do not use `<style>`, `class`, `style="…"`, `<foreignObject>`, scripts,
  animation, or event attributes.

Export:

```bash
python3 skills/paper-diagram/scripts/svg_export.py figure.svg
```

This produces `figure.pdf` and `figure.jpg`.

### Phase 2B: PPTX Backend (Fallback)

Use this path only when the user explicitly asks for editable PPTX.

Read `references/pptx-style.md`, then write a Python script using
`scripts/pptx_layout.py`:

```python
import sys
sys.path.insert(0, "skills/paper-diagram/scripts")

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx_layout import Grid, add_arrow, add_box, add_group_box

prs = Presentation()
prs.slide_width = Inches(7.0)
prs.slide_height = Inches(5.0)
slide = prs.slides.add_slide(prs.slide_layouts[6])

grid = Grid(prs.slide_width, prs.slide_height, cols=3, col_widths=[1, 2, 1])
box_a = add_box(slide, *grid.cell(0, 0, height=0.6), text="Encoder", role="primary")
box_b = add_box(slide, *grid.cell(0, 1, height=0.6), text="Decoder", role="baseline")
add_arrow(slide, box_a, box_b, direction="right")

prs.save("figure.pptx")
```

When placing elements inside a group box, leave at least **0.45 in** from the
group's top edge before the first inner element; the label occupies the top
~0.2 in.

Export:

```bash
python3 skills/paper-diagram/scripts/pptx_export.py figure.pptx
```

This produces `figure.pdf` and `figure.jpg`.

### Phase 3: Visual QA

Compare the generated preview (`figure.jpg`) against the Figure Spec and, when
available, the original image.

Check:

1. all elements present — no missing boxes, arrows, labels, or groups;
2. spatial layout matches intended row/column/group relationships;
3. text content is correct and not truncated;
4. semantic roles are applied consistently;
5. arrows connect correct source/target and have visible arrowheads;
6. no overlapping or colliding elements;
7. margins, spacing, and padding are consistent;
8. PDF is vector-first (JPG is preview only, not the paper asset).

If issues appear, fix the SVG/PPTX script and re-export.  Do not declare done
until a full pass reveals no issues.  Use a subagent for fresh-eye inspection
when possible.

## Reference Routing

| Need | Read |
|------|------|
| Intermediate spec for both backends | `references/figure-spec.md` |
| SVG backend rules and templates | `references/svg-style.md` |
| Shared academic style, typography, CJK, spacing | `references/academic-style.md` |
| PPTX fallback backend | `references/pptx-style.md` |
| SVG export script | `scripts/svg_export.py` (top docstring) |
| PPTX layout helper | `scripts/pptx_layout.py` (top docstring) |
| PPTX export script | `scripts/pptx_export.py` (top docstring) |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Defaulting to PPTX when user only needs PDF | Use SVG backend by default |
| Drawing directly from prose | Build Figure Spec first |
| Missing SVG `viewBox` | Always use width/height/viewBox together |
| Using CSS (`<style>`, `class`, `style="…"`) in SVG | Use inline SVG attributes |
| Using bare `&` / `<` / `>` in SVG text | Escape as XML entities |
| Arrowheads missing in SVG | Use standard `marker-end` template from svg-style.md |
| Text lines split into many SVG `<text>` nodes | Use one logical line with `<tspan>` for inline emphasis |
| Need PPT editability but using SVG | Switch to PPTX backend |
| Manual PPTX coordinate math | Use `Grid.cell()` and `add_arrow()` |
| JPG used as paper output | Use `figure.pdf` or `figure.svg`; JPG is only preview |
