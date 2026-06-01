---
name: paper-diagram
description: >
  Redraw AI-generated images as clean PPTX diagrams for academic papers.
  Use when the user provides an image or text description (flowchart,
  architecture diagram, data-flow figure) and wants it "redrawn",
  "recreated as PPT", "converted for paper", "made publication-ready",
  or "exported as PDF for LaTeX/Word". Single-diagram focus — not for
  multi-slide presentations.
---

# Paper Diagram Skill

Redraw AI-generated raster diagrams as editable PPTX vector figures
suitable for academic papers. Two entry paths: (A) vision analysis of
an existing image, or (B) direct reconstruction from a text specification.
Uses `scripts/layout.py` for declarative layout (Grid + Arrow + role colors)
to eliminate manual coordinate math.

## When to Use

Use this skill when:

- the user provides an image and asks to "redraw", "remake", "convert for paper",
  "make clean version", or "export as PDF for publication";
- the user provides a text description of a diagram layout and wants it built
  from scratch;
- the image/description is a flowchart, architecture diagram, pipeline figure,
  data-flow diagram, comparison table-figure, or annotated illustration;
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

### Entry Gate

Check what the user provided:

| Input | Path |
|-------|------|
| Image file (PNG/JPG/WebP/…) | → Phase 1 (Vision Analysis) |
| Text description of layout, with no image | → Phase 0 (Text Spec) |
| Both image and text | → Phase 1; use text as supplement |

### Phase 0: Text Spec (no-image path)

When the user provides only a text description of the diagram, produce a
structured inventory directly — no vision analysis needed.

Ask clarifying questions only if the description is missing critical
information (number of elements, flow direction, nesting).  Otherwise
proceed straight to the structured element table:

| # | Element | Shape | Position | Size (est.) | Text | Color | Style Notes |
|---|---------|-------|----------|-------------|------|-------|-------------|

Then produce a spatial summary as in Phase 1 (layout, groupings, connections,
color map).  After the summary, jump directly to Phase 2.

### Phase 1: Vision Analysis (image path)

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

Write a self-contained Python script using `scripts/layout.py` — the
declarative layout helper that replaces manual coordinate math.

#### Slide Setup

```python
import sys
sys.path.insert(0, "skills/paper-diagram/scripts")

from pptx import Presentation
from pptx.util import Inches, Pt
from layout import Grid, add_arrow, add_box, add_group_box, ROLE_COLORS, apply_role

prs = Presentation()
# Paper figure widths — pick one:
# Single column: 3.5 in    Double column: 7.0 in    Full page: 8.5 in
prs.slide_width  = Inches(7.0)
prs.slide_height = Inches(5.0)
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
```

#### Declarative Layout with Grid

```python
grid = Grid(
    prs.slide_width, prs.slide_height,
    cols=3,                             # number of columns
    col_widths=[1, 2, 1],               # width ratios (or omit for equal)
    gap=0.15,                           # gap between cells (inches)
    margins=(0.3, 0.3, 0.3, 0.3),      # top, right, bottom, left
)
```

**Important**: estimate `slide_height` from the row count × (box height + gap)
+ margins.  If the grid overflows, increase the height and re-run.

#### Placing Elements

Use `grid.cell(row, col, height=…)` to get absolute positions:

```python
box_a = add_box(slide, *grid.cell(0, 0, height=0.6),
                text="Encoder", role="primary")

When placing elements inside a group box, leave at least **0.45 in** from
the group's top edge before the first inner element — the label occupies
the top ~0.2 in.
box_b = add_box(slide, *grid.cell(1, 0, colspan=2, height=0.8),
                text="Cross-Attention", role="secondary")
```

**Role colors** (from `ROLE_COLORS`): `primary`, `secondary`, `baseline`,
`emphasis`, `success`, `warning`.  See `references/academic-style.md` for
the exact hex values.

Map each element to a role based on its semantic function:
- Core contribution / novel component → `primary`
- Important but not novel → `secondary`
- Supporting / infrastructure → `baseline`
- Key result / highlight → `emphasis`
- Positive outcome → `success`

If none of the above fit, use raw `RGBColor` values.  Switching a role
later changes every element using that role in one line.

#### Adding Arrows

```python
add_arrow(slide, box_a, box_b, direction="right")   # or "down", "up", "left"
```

Arrows automatically add padding (gap between shape edge and arrow tip)
and triangle arrowheads.  The `pad` parameter (default 0.08 in) controls
the gap — increase for more breathing room.

**Never** compute arrow endpoints manually.  Always use `add_arrow`.

#### Group Boxes

```python
left, top, width, height = grid.cell(2, 0, colspan=3, height=2.0)
grp = add_group_box(slide, left, top, width, height, label="Details")
# Place internal elements relative to grp position
```

#### Fallback: Raw python-pptx

If the layout is too irregular for the Grid, fall back to raw python-pptx.
Read `references/patterns.md` for manual code patterns.  Still use
`add_arrow` and `add_box` / `apply_role` — they work without Grid too.

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

Compare the generated `output.jpg` against the original image (or text
spec). Check:

1. All elements present — no missing boxes, arrows, or labels
2. Spatial layout matches — relative positions and grouping
3. Text content correct — no truncation, correct labels
4. Color mapping accurate — roles applied correctly
5. Arrow connections correct — source → target, visible arrowheads
6. No overlapping or colliding elements
7. Margins and padding consistent

If issues found, fix the script and re-run. Do not declare done until
a full pass reveals no issues. Use a subagent for fresh-eye inspection
when possible.

## Reference Routing

| Need | Read |
|------|------|
| Paper figure style spec (dimensions, typography, colors, spacing) | `references/academic-style.md` |
| Raw python-pptx code patterns (fallback for irregular layouts) | `references/patterns.md` |
| Layout helper API (Grid, add_arrow, add_box, roles) | `scripts/layout.py` (top docstring) |
| Conversion script (PPTX→PDF→JPG) | `scripts/convert.py` (top docstring) |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Manual `Inches()` math in reconstruction scripts | Use `Grid.cell()` for all positions |
| Computing arrow endpoints by hand | Use `add_arrow(from, to, direction)` |
| Changing one element's color breaks consistency | Use role names; change the role once |
| `slide_height` too short for grid content | Check `grid.total_height` and adjust before saving |
| Forgetting `sys.path.insert` for layout import | Add to top of script before `from layout import …` |
| Using single-element rows in a multi-column grid | Use `colspan=` to merge cells |
| Default slide layout has placeholders | Always use `slide_layouts[6]` (blank) |
| Generating raster (JPG) from PPTX for paper | Papers need vector; use PDF output, not JPG |
| Text overflow in narrow boxes | Set role-based font size; reduce text or widen column |
| Chinese / CJK text causes encoding issues | Use raw strings or escape quotes; see academic-style.md |
