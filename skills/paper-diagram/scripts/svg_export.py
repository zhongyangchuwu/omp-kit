#!/usr/bin/env python3
"""Validate SVG and export paper-diagram figures to PDF/JPG.

Usage:
    python3 svg_export.py figure.svg              # → figure.pdf + figure.jpg
    python3 svg_export.py figure.svg --dpi 150    # lower DPI preview
    python3 svg_export.py figure.svg --only pdf   # PDF only
    python3 svg_export.py figure.svg --validate-only

Conversion backends, in order:
    1. rsvg-convert (preferred)
    2. CairoSVG Python package, if installed
    3. LibreOffice (soffice) fallback

Requires Poppler (pdftoppm) for JPG previews.
"""

from __future__ import annotations

import argparse
import importlib.util
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

BANNED_TAGS = {
    "foreignObject",
    "script",
    "style",
    "iframe",
    "animate",
    "animateMotion",
    "animateTransform",
    "animateColor",
    "set",
}

BANNED_ATTRIBUTES = {
    "class",
    "style",
}

REQUIRED_SVG_ATTRIBUTES = {
    "viewBox",
}


@dataclass(frozen=True)
class ValidationResult:
    errors: list[str]
    warnings: list[str]

    @property
    def ok(self) -> bool:
        return not self.errors


def _local_name(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[1]
    return tag


def validate_svg(svg_path: Path) -> ValidationResult:
    """Validate an SVG against the SVG-first paper-diagram subset."""
    errors: list[str] = []
    warnings: list[str] = []

    try:
        root = ET.parse(svg_path).getroot()
    except ET.ParseError as exc:
        return ValidationResult(
            errors=[f"XML parse error: {exc}. Escape &, <, > in text/attributes."],
            warnings=[],
        )

    if _local_name(root.tag) != "svg":
        errors.append(f"Root element must be <svg>, got <{_local_name(root.tag)}>")

    for attr in REQUIRED_SVG_ATTRIBUTES:
        if attr not in root.attrib:
            errors.append(f"Missing required root attribute: {attr}")

    if "width" not in root.attrib or "height" not in root.attrib:
        warnings.append("Root <svg> should include width and height matching viewBox.")

    first_child = next(iter(root), None)
    if first_child is None or _local_name(first_child.tag) != "rect":
        warnings.append("First child should be a full-canvas <rect> background.")

    for elem in root.iter():
        tag = _local_name(elem.tag)
        if tag in BANNED_TAGS:
            errors.append(f"Banned SVG tag: <{tag}>")

        for attr in elem.attrib:
            attr_name = _local_name(attr)
            if attr_name in BANNED_ATTRIBUTES:
                errors.append(f"Banned SVG attribute on <{tag}>: {attr_name}")
            if attr_name.startswith("on"):
                errors.append(f"Banned event attribute on <{tag}>: {attr_name}")

        if tag == "text":
            font_family = elem.attrib.get("font-family")
            if not font_family:
                warnings.append("<text> should set font-family explicitly.")
            elif not any(
                fallback in font_family
                for fallback in ("Arial", "Microsoft YaHei", "Noto Sans CJK", "sans-serif")
            ):
                warnings.append(
                    f"<text> font-family lacks safe fallback: {font_family!r}"
                )

    return ValidationResult(errors=errors, warnings=warnings)


def svg_to_pdf(svg_path: Path, output_dir: Path) -> Path:
    """Convert SVG to PDF using the best available backend."""
    pdf_path = output_dir / f"{svg_path.stem}.pdf"

    rsvg = shutil.which("rsvg-convert")
    if rsvg:
        result = subprocess.run(
            [rsvg, "-f", "pdf", "-o", str(pdf_path), str(svg_path)],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0 and pdf_path.exists():
            return pdf_path
        last_error = result.stderr.strip() or result.stdout.strip()
    else:
        last_error = "rsvg-convert not found"

    if importlib.util.find_spec("cairosvg") is not None:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "cairosvg",
                str(svg_path),
                "-o",
                str(pdf_path),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0 and pdf_path.exists():
            return pdf_path
        last_error = result.stderr.strip() or result.stdout.strip() or last_error

    soffice = shutil.which("soffice")
    if soffice:
        result = subprocess.run(
            [
                soffice,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(output_dir),
                str(svg_path),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0 and pdf_path.exists():
            return pdf_path
        last_error = result.stderr.strip() or result.stdout.strip() or last_error

    raise RuntimeError(f"SVG→PDF conversion failed. Last error: {last_error}")


def pdf_to_images(pdf_path: Path, output_dir: Path, dpi: int = 300) -> list[Path]:
    """Convert PDF pages to JPEG previews via pdftoppm."""
    prefix = output_dir / pdf_path.stem
    result = subprocess.run(
        ["pdftoppm", "-jpeg", "-r", str(dpi), str(pdf_path), str(prefix)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        stderr = result.stderr.strip()
        raise RuntimeError(f"pdftoppm conversion failed (exit {result.returncode}):\n{stderr}")

    images = sorted(output_dir.glob(f"{pdf_path.stem}-*.jpg"))
    if not images:
        raise RuntimeError(f"No images produced from {pdf_path}")
    return images


def _print_validation(result: ValidationResult) -> None:
    for warning in result.warnings:
        print(f"Warning: {warning}")
    for error in result.errors:
        print(f"Error: {error}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate SVG and export to PDF/JPG for paper-diagram QA."
    )
    parser.add_argument("svg", type=Path, help="Path to .svg file")
    parser.add_argument("--dpi", type=int, default=300, help="DPI for preview image")
    parser.add_argument("--only", choices=["pdf", "image"], default=None)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()

    svg_path = args.svg.resolve()
    if not svg_path.exists():
        print(f"Error: {svg_path} not found", file=sys.stderr)
        sys.exit(1)
    if svg_path.suffix.lower() != ".svg":
        print(f"Error: {svg_path} is not a .svg file", file=sys.stderr)
        sys.exit(1)

    result = validate_svg(svg_path)
    _print_validation(result)
    if not result.ok:
        sys.exit(2)
    if args.validate_only:
        print("SVG validation passed.")
        return

    output_dir = svg_path.parent

    if args.only != "image":
        print(f"Converting {svg_path.name} → PDF ...")
        pdf_path = svg_to_pdf(svg_path, output_dir)
        print(f"  → {pdf_path.name}")

    if args.only != "pdf":
        pdf_path = output_dir / f"{svg_path.stem}.pdf"
        if not pdf_path.exists():
            pdf_path = svg_to_pdf(svg_path, output_dir)
        print(f"Converting PDF → images ({args.dpi} DPI) ...")
        images = pdf_to_images(pdf_path, output_dir, dpi=args.dpi)
        if len(images) == 1:
            target = output_dir / f"{svg_path.stem}.jpg"
            images[0].rename(target)
            print(f"  → {target.name}")
        else:
            for img in images:
                print(f"  → {img.name}")

    print("Done.")


if __name__ == "__main__":
    main()
