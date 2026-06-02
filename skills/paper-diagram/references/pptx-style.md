# PPTX Backend Style Guide

Use this backend only when the user explicitly needs PowerPoint editability.
SVG is the default for publication PDF figures.  These python-pptx patterns
are fallback examples for irregular layouts or manual PPTX reconstruction.

Prefer `scripts/pptx_layout.py` (`Grid`, `add_box`, `add_arrow`) before using
raw python-pptx coordinates.

## Preferred Imports

```python
import sys
sys.path.insert(0, "skills/paper-diagram/scripts")

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx_layout import Grid, add_arrow, add_box, add_group_box

prs = Presentation()
prs.slide_width  = Inches(7.0)   # double-column
prs.slide_height = Inches(5.0)   # adjust from content
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
```

## Raw python-pptx Imports (fallback only)

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu, Cm
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
```

## Pattern 1: Flowchart (boxes + arrows)

Vertical or horizontal chain of rounded rectangles connected by arrows.

### Adding a Box

```python
def add_box(slide, left, top, width, height, text, fill_color, border_color, font_size=Pt(9)):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1.0)
    # Text
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.08)
    tf.margin_right = Inches(0.08)
    tf.margin_top = Inches(0.05)
    tf.margin_bottom = Inches(0.05)
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = font_size
    p.font.color.rgb = RGBColor(0x1A, 0x1A, 0x1A)
    p.font.name = "Arial"
    p.alignment = PP_ALIGN.CENTER
    return shape

box = add_box(
    slide,
    left=Inches(2.5), top=Inches(0.5),
    width=Inches(2.0), height=Inches(0.6),
    text="Input Embedding",
    fill_color=RGBColor(0xE8, 0xE8, 0xE8),
    border_color=RGBColor(0x40, 0x40, 0x40),
)
```

### Adding an Arrow Between Boxes

```python
def add_arrow_between(slide, from_shape, to_shape, color=RGBColor(0x40,0x40,0x40)):
    """Add a straight down-arrow connector between two shapes."""
    cx = from_shape.left + from_shape.width // 2  # center X
    begin_y = from_shape.top + from_shape.height
    end_y   = to_shape.top
    connector = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT, cx, begin_y, cx, end_y
    )
    connector.line.color.rgb = color
    connector.line.width = Pt(1.0)
    # Arrow head at end
    connector.end_x = cx
    connector.end_y = end_y
    return connector

add_arrow_between(slide, box1, box2)
```

### Vertical Flowchart Layout

```python
boxes = [
    ("Input",       Inches(1.0)),
    ("Encoder",     Inches(2.0)),
    ("Latent",      Inches(3.0)),
    ("Decoder",     Inches(4.0)),
    ("Output",      Inches(5.0)),
]
shapes = []
box_w, box_h = Inches(2.0), Inches(0.6)
center_x = prs.slide_width // 2 - box_w // 2

for text, top in boxes:
    s = add_box(slide, left=center_x, top=top,
                width=box_w, height=box_h, text=text,
                fill_color=RGBColor(0xE8,0xE8,0xE8),
                border_color=RGBColor(0x40,0x40,0x40))
    shapes.append(s)

for i in range(len(shapes) - 1):
    add_arrow_between(slide, shapes[i], shapes[i+1])
```

## Pattern 2: Architecture Diagram (nested boxes + labels)

Large bounding boxes with internal elements. Use for system architecture,
pipeline stages, or layered designs.

### Group Box (Container)

```python
def add_group_box(slide, left, top, width, height, label, fill=None, border_color=None):
    if fill is None:
        fill = RGBColor(0xF5, 0xF5, 0xF5)  # very light
    if border_color is None:
        border_color = RGBColor(0x80, 0x80, 0x80)  # dashed-look via color

    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1.0)
    shape.line.dash_style = 2  # dash

    # Label in top-left corner
    tf = shape.text_frame
    tf.margin_left = Inches(0.06)
    tf.margin_top = Inches(0.03)
    p = tf.paragraphs[0]
    p.text = label
    p.font.size = Pt(8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(0x50, 0x50, 0x50)
    p.font.name = "Arial"
    return shape

group = add_group_box(
    slide,
    left=Inches(1.0), top=Inches(0.5),
    width=Inches(5.0), height=Inches(3.0),
    label="Transformer Block",
)
```

### Elements Inside a Group

Place smaller shapes inside the group box using coordinates relative to the group:

```python
inner_left = group.left + Inches(0.2)
inner_top  = group.top + Inches(0.4)
inner_w    = group.width - Inches(0.4)
inner_h    = Inches(0.5)

add_box(slide, inner_left, inner_top, inner_w, inner_h,
        "Multi-Head Attention",
        RGBColor(0xD6,0xE4,0xF0), RGBColor(0x2E,0x75,0xB6))
```

## Pattern 3: Horizontal Pipeline

Left-to-right sequence of stages. Common for data processing pipelines.

```python
stages = ["Raw Data", "Preprocess", "Feature Extract", "Model", "Output"]
n = len(stages)
box_w = Inches(1.1)
box_h = Inches(0.7)
gap = Inches(0.3)
total_w = n * box_w + (n - 1) * gap
start_x = (prs.slide_width - total_w) // 2
y = Inches(1.5)

shapes = []
for i, label in enumerate(stages):
    x = start_x + i * (box_w + gap)
    s = add_box(slide, x, y, box_w, box_h, label,
                RGBColor(0xE8,0xE8,0xE8), RGBColor(0x40,0x40,0x40),
                font_size=Pt(8))
    shapes.append(s)

# Right arrows between stages
for i in range(len(shapes) - 1):
    s1, s2 = shapes[i], shapes[i+1]
    ax = s1.left + s1.width
    ay = s1.top + s1.height // 2
    bx = s2.left
    by = s2.top + s2.height // 2
    conn = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, ax, ay, bx, by)
    conn.line.color.rgb = RGBColor(0x40, 0x40, 0x40)
    conn.line.width = Pt(1.0)
```

## Pattern 4: Two-Column Comparison

Side-by-side boxes for before/after, pros/cons, or method comparisons.

```python
left_col_x  = Inches(1.5)
right_col_x = Inches(4.0)
col_w = Inches(2.2)
y = Inches(0.5)

# Left column
add_group_box(slide, left_col_x, y, col_w, Inches(4.0), "Baseline")
add_box(slide, left_col_x + Inches(0.15), y + Inches(0.5),
        col_w - Inches(0.3), Inches(0.6),
        "CNN Encoder", RGBColor(0xE8,0xE8,0xE8), RGBColor(0x40,0x40,0x40))

# Right column
add_group_box(slide, right_col_x, y, col_w, Inches(4.0), "Ours")
add_box(slide, right_col_x + Inches(0.15), y + Inches(0.5),
        col_w - Inches(0.3), Inches(0.6),
        "Transformer Encoder", RGBColor(0xD6,0xE4,0xF0), RGBColor(0x2E,0x75,0xB6))
```

## Pattern 5: Data Flow (inputs/outputs with I/O shapes)

Use slanted parallelograms for data sources/sinks.

```python
def add_io_shape(slide, left, top, width, height, text, is_input=True):
    """Parallelogram for data source (input) or sink (output)."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.PARALLELOGRAM, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(0xF0, 0xF0, 0xF0)
    shape.line.color.rgb = RGBColor(0x40, 0x40, 0x40)
    shape.line.width = Pt(1.0)
    tf = shape.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(9)
    p.font.name = "Arial"
    p.alignment = PP_ALIGN.CENTER
    return shape
```

## Pattern 6: Attention/Matrix Visualization

Grid of small squares with color-coding. For attention maps, correlation
matrices, or heatmap-style diagrams.

```python
def draw_grid(slide, left, top, cell_size, rows, cols, gap, colors_2d):
    """Draw a grid of colored squares. colors_2d is rows×cols of RGBColor."""
    for r in range(rows):
        for c in range(cols):
            x = left + c * (cell_size + gap)
            y = top  + r * (cell_size + gap)
            sq = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE, x, y, cell_size, cell_size
            )
            sq.fill.solid()
            sq.fill.fore_color.rgb = colors_2d[r][c]
            sq.line.fill.background()  # no border
```

## Pattern 7: Annotation Callouts

Small text labels pointing to specific parts of a diagram.

```python
def add_callout(slide, x, y, text, target_x, target_y):
    """Add a text label with a line pointing to target."""
    # Small text box
    tb = slide.shapes.add_textbox(x, y, Inches(0.8), Inches(0.3))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(7)
    p.font.color.rgb = RGBColor(0x50, 0x50, 0x50)
    p.font.name = "Arial"

    # Line from text box to target
    line = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT,
        x + Inches(0.4), y,
        target_x, target_y,
    )
    line.line.color.rgb = RGBColor(0x80, 0x80, 0x80)
    line.line.width = Pt(0.75)
    return tb, line
```

## Save Output

```python
prs.save("output.pptx")
print("Saved output.pptx")
```
