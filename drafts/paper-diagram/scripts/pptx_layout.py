"""PPTX layout helpers for paper-diagram — Grid, semantic arrows, role colors.

Import in LLM-generated PPTX reconstruction scripts to replace manual coordinate math.

Usage:
    from pptx_layout import Grid, add_arrow, add_box, ROLE_COLORS, apply_role
    grid = Grid(slide_w, slide_h, cols=3, col_widths=[1,2,1], gap=0.15)

    box_a = add_box(slide, *grid.cell(0, 0, height=0.6), text="Encoder", role="primary")
    box_b = add_box(slide, *grid.cell(0, 2, height=0.6), text="Decoder", role="primary")
    add_arrow(slide, box_a, box_b, direction="right")
"""

from __future__ import annotations

from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN

# ---------------------------------------------------------------------------
# Role-based color system
# ---------------------------------------------------------------------------

ROLE_COLORS = {
    "primary": {
        "fill":   RGBColor(0xD6, 0xE4, 0xF0),  # light blue
        "border": RGBColor(0x2E, 0x75, 0xB6),  # deep blue
        "text":   RGBColor(0x1A, 0x1A, 0x1A),
    },
    "secondary": {
        "fill":   RGBColor(0xFD, 0xE4, 0xC3),  # light orange
        "border": RGBColor(0xED, 0x7D, 0x31),
        "text":   RGBColor(0x1A, 0x1A, 0x1A),
    },
    "baseline": {
        "fill":   RGBColor(0xF5, 0xF5, 0xF5),  # near-white
        "border": RGBColor(0x80, 0x80, 0x80),
        "text":   RGBColor(0x1A, 0x1A, 0x1A),
    },
    "emphasis": {
        "fill":   RGBColor(0x50, 0x50, 0x50),  # dark gray
        "border": RGBColor(0x30, 0x30, 0x30),
        "text":   RGBColor(0xFF, 0xFF, 0xFF),
    },
    "success": {
        "fill":   RGBColor(0xD9, 0xEC, 0xD0),  # light green
        "border": RGBColor(0x5B, 0x9B, 0x4F),
        "text":   RGBColor(0x1A, 0x1A, 0x1A),
    },
    "warning": {
        "fill":   RGBColor(0xE6, 0xB8, 0xB7),  # light red
        "border": RGBColor(0xC0, 0x50, 0x4D),
        "text":   RGBColor(0x1A, 0x1A, 0x1A),
    },
}

ROLE_NAMES = tuple(ROLE_COLORS)


def apply_role(shape, role: str, font_size=Pt(9), font_name: str = "Arial"):
    """Apply fill, border, and default text style from a semantic role."""
    c = ROLE_COLORS[role]
    shape.fill.solid()
    shape.fill.fore_color.rgb = c["fill"]
    shape.line.color.rgb = c["border"]
    shape.line.width = Pt(1.0)

    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.08)
    tf.margin_right = Inches(0.08)
    tf.margin_top = Inches(0.05)
    tf.margin_bottom = Inches(0.05)

    p = tf.paragraphs[0]
    p.font.size = font_size
    p.font.color.rgb = c["text"]
    p.font.name = font_name
    p.alignment = PP_ALIGN.CENTER


# ---------------------------------------------------------------------------
# Grid layout engine
# ---------------------------------------------------------------------------

class Grid:
    """Declarative column-based layout.

    Computes absolute positions from column-width ratios and row heights.
    Call ``cell(row, col, height=...)`` for each cell; the grid tracks
    declared row heights and auto-computes ``top`` for later rows.

    ``col_widths`` is a list of ratios (e.g. ``[1, 2, 1]``).  Omit for
    equal-width columns.  ``gap`` and ``margins`` are in inches.
    """

    def __init__(
        self,
        slide_width,
        slide_height,
        cols: int,
        col_widths: list[float] | None = None,
        gap: float = 0.15,
        margins: tuple[float, float, float, float] = (0.3, 0.3, 0.3, 0.3),
    ):
        # Normalize slide_width / slide_height to inches (accept EMU, Inches, or float)
        self._slide_w = _to_inches(slide_width)
        self._slide_h = _to_inches(slide_height)
        self._cols = cols
        self._gap = gap
        self._mt, self._mr, self._mb, self._ml = margins

        available_w = self._slide_w - self._ml - self._mr - (cols - 1) * gap

        if col_widths is None:
            cw = [1.0] * cols
        else:
            if len(col_widths) != cols:
                raise ValueError(
                    f"col_widths length ({len(col_widths)}) != cols ({cols})"
                )
            cw = [float(w) for w in col_widths]

        total = sum(cw)
        self._col_widths = [available_w * (w / total) for w in cw]

        # Column left-edge positions (inches)
        self._col_lefts: list[float] = []
        x = self._ml
        for w in self._col_widths:
            self._col_lefts.append(x)
            x += w + gap

        # Track per-row heights for top computation
        self._row_heights: dict[int, float] = {}
        self._default_row_height = 0.6

    def cell(
        self,
        row: int,
        col: int,
        height: float = 0.6,
        rowspan: int = 1,  # noqa: ARG001 (reserved for future span support)
        colspan: int = 1,
    ) -> tuple:
        """Return ``(left, top, width, height)`` as ``Inches`` for a grid cell.

        ``height`` is in inches.  The grid remembers the max height declared
        for each row so that later rows are positioned correctly.
        """
        # Record row height
        prev = self._row_heights.get(row, 0.0)
        if height > prev:
            self._row_heights[row] = height

        # Left edge
        left = self._col_lefts[col]

        # Width (sum spanned column widths + gaps between them)
        width = sum(self._col_widths[col:col + colspan])
        if colspan > 1:
            width += (colspan - 1) * self._gap

        # Top edge — accumulate heights of previous rows
        top = self._mt
        for r in range(row):
            top += self._row_heights.get(r, self._default_row_height) + self._gap

        return (Inches(left), Inches(top), Inches(width), Inches(height))

    @property
    def row_count(self) -> int:
        """Highest row index used (0-based), or 0 if no cells placed."""
        return max(self._row_heights) + 1 if self._row_heights else 0

    @property
    def total_height(self) -> float:
        """Total used height in inches (top margin + rows + gaps)."""
        if not self._row_heights:
            return self._mt + self._mb
        h = self._mt
        for r in range(max(self._row_heights) + 1):
            h += self._row_heights.get(r, self._default_row_height)
            if r < max(self._row_heights):
                h += self._gap
        return h + self._mb


# ---------------------------------------------------------------------------
# Semantic arrow connector
# ---------------------------------------------------------------------------

def add_arrow(
    slide,
    from_shape,
    to_shape,
    direction: str = "down",
    pad: float = 0.08,
    color: RGBColor | None = None,
    width_pt: float = 1.0,
):
    """Draw a straight connector arrow between two shapes.

    ``from_shape`` / ``to_shape`` can be python-pptx Shape objects or
    ``(left, top, width, height)`` tuples.  ``pad`` (inches) controls
    the gap between the shape edge and the arrow endpoint.

    ``direction`` is ``"down"``, ``"up"``, ``"left"``, or ``"right"``.
    """
    if color is None:
        color = RGBColor(0x40, 0x40, 0x40)

    a = _shape_bounds(from_shape)
    b = _shape_bounds(to_shape)

    begin_x, begin_y = _arrow_endpoint(a, direction, pad)
    end_x, end_y = _arrow_endpoint(b, _opposite(direction), pad)

    connector = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT,
        Inches(begin_x), Inches(begin_y),
        Inches(end_x), Inches(end_y),
    )
    connector.line.color.rgb = color
    connector.line.width = Pt(width_pt)

    # Fix: zero-extent connectors are invisible in some renderers.
    # Ensure non-zero cx/cy on the bounding box.
    _ensure_connector_extent(connector)

    # Add arrowhead marker at tail (end) of the line.
    _add_arrowhead(connector)

    return connector


def _shape_bounds(shape) -> tuple:
    """Return ``(left_in, top_in, width_in, height_in)`` for a shape or tuple."""
    if isinstance(shape, tuple):
        return tuple(_to_inches(v) for v in shape)
    return (
        _to_inches(shape.left),
        _to_inches(shape.top),
        _to_inches(shape.width),
        _to_inches(shape.height),
    )


def _arrow_endpoint(
    bounds: tuple[float, float, float, float],
    direction: str,
    pad: float,
) -> tuple[float, float]:
    """Compute the connector endpoint on the edge of a bounding box."""
    left, top, width, height = bounds
    cx = left + width / 2
    cy = top + height / 2

    if direction == "down":
        return (cx, top + height + pad)
    elif direction == "up":
        return (cx, top - pad)
    elif direction == "right":
        return (left + width + pad, cy)
    elif direction == "left":
        return (left - pad, cy)
    else:
        raise ValueError(f"Unknown direction: {direction!r}")


def _opposite(direction: str) -> str:
    return {"down": "up", "up": "down", "left": "right", "right": "left"}[direction]


# ---------------------------------------------------------------------------
# Convenience shape constructors
# ---------------------------------------------------------------------------

def add_box(
    slide,
    left,
    top,
    width,
    height,
    text: str = "",
    role: str = "baseline",
    font_size=Pt(9),
    font_name: str = "Arial",
):
    """Add a rounded-rect box with role-based styling."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    apply_role(shape, role, font_size=font_size, font_name=font_name)
    if text:
        shape.text_frame.paragraphs[0].text = text
    return shape


def add_group_box(
    slide,
    left,
    top,
    width,
    height,
    label: str = "",
    fill: RGBColor | None = None,
    border_color: RGBColor | None = None,
    font_size=Pt(8),
):
    """Add a dashed bounding box (container / group)."""
    if fill is None:
        fill = RGBColor(0xF5, 0xF5, 0xF5)
    if border_color is None:
        border_color = RGBColor(0x80, 0x80, 0x80)

    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1.0)
    shape.line.dash_style = 2

    tf = shape.text_frame
    tf.margin_left = Inches(0.06)
    tf.margin_top = Inches(0.03)
    p = tf.paragraphs[0]
    p.text = label
    p.font.size = font_size
    p.font.bold = True
    p.font.color.rgb = RGBColor(0x50, 0x50, 0x50)
    p.font.name = "Arial"
    return shape


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_inches(value) -> float:
    """Normalize EMU, Inches, Pt, or raw float to inches."""
    if hasattr(value, "inches"):
        return float(value.inches)  # Inches or Emu
    if isinstance(value, (int, float)):
        return float(value)
    raise TypeError(f"Cannot convert {type(value).__name__} to inches")


def _ensure_connector_extent(connector) -> None:
    """Ensure connector bounding-box extent has no zero dimensions.

    python-pptx creates connectors with cx=0 (vertical) or cy=0
    (horizontal), which some renderers treat as invisible.  Adds a
    1-pixel minimum (~12700 EMU) to the zero dimension.
    """
    DML_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
    xfrm = connector.element.find(f".//{{{DML_NS}}}xfrm")
    if xfrm is None:
        return
    ext = xfrm.find(f"{{{DML_NS}}}ext")
    if ext is None:
        return
    MIN_EMU = 12700  # ~1 px
    if int(ext.get("cx", 0)) == 0:
        ext.set("cx", str(MIN_EMU))
    if int(ext.get("cy", 0)) == 0:
        ext.set("cy", str(MIN_EMU))


def _add_arrowhead(connector) -> None:
    """Add a triangle arrowhead at the end of the connector line."""
    from lxml import etree
    from pptx.oxml.ns import qn
    ln = connector.line._ln
    # Check if tailEnd already exists
    existing = ln.find(qn("a:tailEnd"))
    if existing is not None:
        return
    tail = etree.SubElement(ln, qn("a:tailEnd"))
    tail.set("type", "triangle")
    tail.set("w", "med")
    tail.set("len", "med")
