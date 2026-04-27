#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image


def positive_int(value):
    try:
        n = int(value)
        return n if n > 0 else None
    except Exception:
        return None


def alpha_bounds(alpha, axis: str, threshold: int = 0):
    width, height = alpha.size
    if axis == 'x':
        return [any(alpha.getpixel((x, y)) > threshold for y in range(height)) for x in range(width)]
    return [any(alpha.getpixel((x, y)) > threshold for x in range(width)) for y in range(height)]


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


def rgb(img):
    return img.convert('RGB')


def edge_difference_segments(img, axis: str, sample_stride: int = 1):
    src = rgb(img)
    width, height = src.size
    values = []

    if axis == 'x':
        for x in range(width - 1):
            acc = 0
            count = 0
            for y in range(0, height, max(1, sample_stride)):
                a = src.getpixel((x, y))
                b = src.getpixel((x + 1, y))
                acc += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
                count += 1
            values.append(acc / max(1, count))
    else:
        for y in range(height - 1):
            acc = 0
            count = 0
            for x in range(0, width, max(1, sample_stride)):
                a = src.getpixel((x, y))
                b = src.getpixel((x, y + 1))
                acc += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
                count += 1
            values.append(acc / max(1, count))

    if not values:
        return []

    avg = sum(values) / len(values)
    peaks = [i for i, v in enumerate(values) if v > avg * 1.8]
    boundaries = []
    cluster = []
    for idx in peaks:
        if cluster and idx != cluster[-1] + 1:
            boundaries.append(round(sum(cluster) / len(cluster)))
            cluster = []
        cluster.append(idx)
    if cluster:
        boundaries.append(round(sum(cluster) / len(cluster)))
    return boundaries


def best_factorization(width: int, height: int, hinted_frames: int):
    best = None
    for cols in range(1, hinted_frames + 1):
        if hinted_frames % cols != 0:
            continue
        rows = hinted_frames // cols
        frame_w = width / cols
        frame_h = height / rows
        ratio = frame_w / max(1, frame_h)
        score = abs(ratio - 1) + abs(cols - rows) * 0.05
        candidate = (score, cols, rows, frame_w, frame_h)
        if best is None or candidate < best:
            best = candidate
    if best is None:
        return 1, hinted_frames
    return best[1], best[2]


def choose_grid(img, hinted_frames: int | None):
    alpha = img.getchannel('A')
    x_segments = infer_segments(img.width, transparent_gaps(alpha_bounds(alpha, 'x')))
    y_segments = infer_segments(img.height, transparent_gaps(alpha_bounds(alpha, 'y')))

    columns = len(x_segments)
    rows = len(y_segments)
    frame_count = columns * rows
    method = 'alpha-gaps'

    if columns == 1 and rows == 1:
        x_edges = edge_difference_segments(img, 'x', sample_stride=max(1, img.height // 128))
        y_edges = edge_difference_segments(img, 'y', sample_stride=max(1, img.width // 128))
        if x_edges or y_edges:
            columns = max(1, len(x_edges) + 1)
            rows = max(1, len(y_edges) + 1)
            frame_count = columns * rows
            method = 'edge-differences'

    if hinted_frames and hinted_frames > 1:
        if frame_count == 1:
            columns, rows = best_factorization(img.width, img.height, hinted_frames)
            frame_count = columns * rows
            method = 'factorized-hint'
        elif frame_count != hinted_frames:
            if columns > 1 and hinted_frames % columns == 0:
                rows = max(1, hinted_frames // columns)
                frame_count = columns * rows
                method = f'{method}+hint-rows'
            elif rows > 1 and hinted_frames % rows == 0:
                columns = max(1, hinted_frames // rows)
                frame_count = columns * rows
                method = f'{method}+hint-cols'
            else:
                columns, rows = best_factorization(img.width, img.height, hinted_frames)
                frame_count = columns * rows
                method = 'factorized-hint'

    frame_width = img.width // max(1, columns)
    frame_height = img.height // max(1, rows)

    return {
        'ok': True,
        'width': img.width,
        'height': img.height,
        'columns': max(1, columns),
        'rows': max(1, rows),
        'frameCount': max(1, frame_count),
        'frameWidth': max(1, frame_width),
        'frameHeight': max(1, frame_height),
        'xSegments': x_segments,
        'ySegments': y_segments,
        'method': method,
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
    result = choose_grid(img, hinted_frames)
    result['input'] = str(input_path)
    print(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
