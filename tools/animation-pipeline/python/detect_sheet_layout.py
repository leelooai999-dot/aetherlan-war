#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


def positive_int(value):
    try:
        n = int(value)
        return n if n > 0 else None
    except Exception:
        return None


def alpha_bounds(alpha, axis: str):
    width, height = alpha.size
    if axis == 'x':
        return [any(alpha.getpixel((x, y)) > 0 for y in range(height)) for x in range(width)]
    return [any(alpha.getpixel((x, y)) > 0 for x in range(width)) for y in range(height)]


def transparent_gaps(mask, min_run=2):
    gaps = []
    start = None
    for i, filled in enumerate(mask):
        if not filled and start is None:
            start = i
        elif filled and start is not None:
            if i - start >= min_run:
                gaps.append((start, i - 1))
            start = None
    if start is not None and len(mask) - start >= min_run:
        gaps.append((start, len(mask) - 1))
    return gaps


def infer_segments(length: int, gaps):
    if not gaps:
        return [(0, length - 1)]
    segments = []
    cursor = 0
    for start, end in gaps:
        if start - cursor >= 2:
            segments.append((cursor, start - 1))
        cursor = end + 1
    if length - cursor >= 2:
        segments.append((cursor, length - 1))
    return segments or [(0, length - 1)]


def choose_grid(width, height, hinted_frames: int | None):
    img = Image.open(Path(sys.argv[1])).convert('RGBA')
    alpha = img.getchannel('A')
    x_segments = infer_segments(img.width, transparent_gaps(alpha_bounds(alpha, 'x')))
    y_segments = infer_segments(img.height, transparent_gaps(alpha_bounds(alpha, 'y')))

    columns = len(x_segments)
    rows = len(y_segments)
    frame_count = columns * rows

    if hinted_frames and hinted_frames > 1:
        if frame_count == 1:
            columns = hinted_frames
            rows = 1
            frame_count = hinted_frames
        elif frame_count != hinted_frames:
            if columns > 1 and hinted_frames % columns == 0:
                rows = max(1, hinted_frames // columns)
                frame_count = columns * rows
            elif rows > 1 and hinted_frames % rows == 0:
                columns = max(1, hinted_frames // rows)
                frame_count = columns * rows

    frame_width = width // max(1, columns)
    frame_height = height // max(1, rows)

    return {
        'ok': True,
        'width': width,
        'height': height,
        'columns': max(1, columns),
        'rows': max(1, rows),
        'frameCount': max(1, frame_count),
        'frameWidth': max(1, frame_width),
        'frameHeight': max(1, frame_height),
        'xSegments': x_segments,
        'ySegments': y_segments,
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({'ok': False, 'error': 'usage: detect_sheet_layout.py <image> [hinted-frame-count]'}))
        return 1

    input_path = Path(sys.argv[1]).resolve()
    hinted_frames = positive_int(sys.argv[2]) if len(sys.argv) > 2 else None
    if not input_path.exists():
        print(json.dumps({'ok': False, 'error': 'input not found', 'input': str(input_path)}))
        return 2

    img = Image.open(input_path).convert('RGBA')
    result = choose_grid(img.width, img.height, hinted_frames)
    result['input'] = str(input_path)
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
