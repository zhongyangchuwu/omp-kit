---
name: paper-diagram
description: >
  Redraw AI-generated images as clean PPTX diagrams for academic papers.
  Use when the user provides an image (flowchart, architecture diagram, 
  data-flow figure) and wants it "redrawn", "recreated as PPT", "converted 
  for paper", "made publication-ready", or "exported as PDF for LaTeX/Word". 
  Single-diagram focus — not for multi-slide presentations.
---

# Paper Diagram Skill

Redraw AI-generated raster diagrams as editable PPTX vector figures
suitable for academic papers. The LLM inspects the image with vision,
then writes python-pptx code that recreates every element as native
PowerPoint shapes — boxes, arrows, connectors, text — for clean PDF export.

## When to Use

Use this skill when:

- the user provides an image and asks to "redraw", "remake", "convert for paper",
  "make clean version", or "export as PDF for publication";
- the image is a flowchart, architecture diagram, pipeline figure, data-flow
  diagram, comparison table-figure, or annotated illustration;
- the user mentions "paper figure", "论文用图", "学术图表", "publication-ready".

Do not use this skill when:

- the user wants a full slide deck or multi-page presentation (use ppt-master);
- the image is a photograph or photograph-like rendering;
- the task is purely text extraction or format conversion;
- the user wants to edit an existing PPTX file.

## Dependencies

```bash
pip install python-pptx Pillow
```

Also required (system):
- LibreOffice (`soffice`) — PPTX → PDF conversion
- Poppler (`pdftoppm`) — PDF → image for visual QA

## Workflow

### Phase 1: Vision Analysis

Inspect the image and produce a structured inventory. Cover every visible
element — do not summarize or skip "minor" items.

Output a Markdown table with these columns:

| # | Element | Shape | Position | Size (est.) | Text | Color | Style Notes |
|---|---------|-------|----------|-------------|------|-------|-------------|

Then output a spatial summary:

- **Overall layout**: vertical/horizontal flow, grid, layered, etc.
- **Groupings**: which elements form logical clusters
- **Connections**: arrows, lines — source → target for each
- **Color map**: list ≤6 distinct colors with roles (primary fill, accent, border, text, background)

### Phase 2: Reconstruction

Write a self-contained Python script that uses `python-pptx` to recreate
the diagram. Follow these constraints:

#### Slide Setup

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN

prs = Presentation()
# Paper figure widths — pick one:
# Single column: 3.5 in × (variable height)
# Double column: 7.0 in × (variable height)
# Full page:     8.5 in × (variable height, max 9 in)
prs.slide_width  = Inches(7.0)
prs.slide_height = Inches(5.0)
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
```

Read `references/academic-style.md` for the full style specification
(sizes, fonts, colors, line weights, spacing). Apply it strictly.

#### Shape Construction Rules

- **Boxes**: use `slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, ...)` 
  or `MSO_SHAPE.RECTANGLE`. Set fill, border, and text.
- **Arrows between shapes**: use `slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, ...)`.
  Set `connector.begin_x/y` and `connector.end_x/y` in EMUs.
- **Standalone arrows**: `MSO_SHAPE.RIGHT_ARROW`, `MSO_SHAPE.DOWN_ARROW`, etc.
- **Text**: access via `shape.text_frame.paragraphs[0]`. Set font, size, color,
  alignment. For multi-line, add paragraphs.
- **Icons/symbols**: use Unicode characters in text boxes, or simple geometric
  shapes (circles, diamonds) with single-character labels.
- **Lines/borders**: `slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, ...)` with
  `fill.background()` and border only — for bounding boxes and separating lines.

Read `references/patterns.md` for ready-to-use code patterns by diagram type.

#### Execution

Save the script and run it:

```bash
python3 <script>.py
```

This produces `output.pptx`.

### Phase 3: Export & QA

**Export to PDF**:

```bash
python3 skills/paper-diagram/scripts/convert.py output.pptx
```

This creates `output.pdf` and `output.jpg` (300 DPI preview).

**Visual QA** (mandatory):

Compare the generated `output.jpg` against the original image. Check:

1. All elements present — no missing boxes, arrows, or labels
2. Spatial layout matches — relative positions and grouping
3. Text content correct — no truncation, correct labels
4. Color mapping accurate — fills, borders, text colors
5. Arrow connections correct — source → target, no crossed wires
6. No overlapping or colliding elements
7. Margins and padding consistent

If issues found, fix the script and re-run. Do not declare done until
a full pass reveals no issues. Use a subagent for fresh-eye inspection
when possible.

## Reference Routing

| Need | Read |
|------|------|
| Paper figure style spec | `references/academic-style.md` |
| python-pptx code patterns | `references/patterns.md` |
| Conversion script docs | `scripts/convert.py` (top docstring) |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `Inches()` with wrong values | 1 inch = 914400 EMU; use `Inches(n)` for readability |
| Forgetting to set shape size | Always set `.left`, `.top`, `.width`, `.height` |
| Text overflow in narrow boxes | Set `word_wrap = True` on text_frame; reduce font if needed |
| Connectors not connecting | Position begin/end points at shape boundaries, not centers |
| Default slide layout has placeholders | Always use `slide_layouts[6]` (blank) |
| Color mismatch between original and PPTX | Use `RGBColor(0xRR, 0xGG, 0xBB)`, not color names |
| PPTX text rendering differs from SVG | PPTX fonts may render slightly wider; add 10% width buffer |
| Generating raster (JPG) from PPTX for paper | Papers need vector; use PDF output, not JPG |
