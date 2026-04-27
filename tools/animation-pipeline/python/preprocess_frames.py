#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from PIL import Image
except Exception:
    Image = None


def trim_bbox(img):
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = img.getchannel("A")
    return alpha.getbbox()


def remove_background(img, tolerance=20, sample_step=8):
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    samples = []
    for x in range(0, width, max(1, sample_step)):
        samples.append(pixels[x, 0][:3])
        samples.append(pixels[x, height - 1][:3])
    for y in range(0, height, max(1, sample_step)):
        samples.append(pixels[0, y][:3])
        samples.append(pixels[width - 1, y][:3])

    if not samples:
        return img, {"bgColor": None, "removedPixels": 0, "tolerance": tolerance}

    bg = tuple(round(sum(channel) / len(samples)) for channel in zip(*samples))
    removed = 0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2])) <= tolerance:
                pixels[x, y] = (r, g, b, 0)
                removed += 1

    return img, {"bgColor": list(bg), "removedPixels": removed, "tolerance": tolerance}


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "usage: preprocess_frames.py <input-path> [output-dir]"}))
        return 1

    input_path = Path(sys.argv[1]).resolve()
    output_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else input_path.parent / "processed"

    if not input_path.exists():
        print(json.dumps({"ok": False, "error": "input not found", "input": str(input_path)}))
        return 2

    if Image is None:
        print(json.dumps({
            "ok": False,
            "error": "Pillow not installed",
            "hint": "pip install pillow",
            "input": str(input_path),
        }))
        return 3

    output_dir.mkdir(parents=True, exist_ok=True)
    original = Image.open(input_path).convert("RGBA")
    cleaned, bg_report = remove_background(original.copy())
    bbox = trim_bbox(cleaned)
    trimmed = cleaned.crop(bbox) if bbox else cleaned
    out_path = output_dir / f"{input_path.stem}.trimmed.png"
    trimmed.save(out_path)

    print(json.dumps({
        "ok": True,
        "input": str(input_path),
        "output": str(out_path),
        "original": {"width": original.width, "height": original.height},
        "trimmed": {"width": trimmed.width, "height": trimmed.height},
        "bbox": list(bbox) if bbox else None,
        "backgroundRemoval": bg_report,
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
