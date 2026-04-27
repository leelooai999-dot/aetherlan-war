#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from PIL import Image


def save_frames(sheet_path: Path, output_dir: Path, frame_width: int, frame_height: int, actions: dict) -> dict:
    img = Image.open(sheet_path).convert("RGBA")
    cols = max(1, img.width // frame_width)
    rows = max(1, img.height // frame_height)
    total = cols * rows

    frames_meta = []
    for index in range(total):
        x = (index % cols) * frame_width
        y = (index // cols) * frame_height
        frame = img.crop((x, y, x + frame_width, y + frame_height))
        frame_name = f"frame_{index:03d}.png"
        frame.save(output_dir / frame_name)
        frames_meta.append({
            "index": index,
            "file": frame_name,
            "x": x,
            "y": y,
            "width": frame_width,
            "height": frame_height,
        })

    action_meta = []
    for action_id, action in actions.items():
        action_frames = list(range(action["start"], action["start"] + action["count"]))
        action_meta.append({
            "id": action_id,
            "fps": action.get("fps", 8),
            "loop": action.get("loop", False),
            "frames": action_frames,
        })

    metadata = {
        "sheet": str(sheet_path),
        "sheetSize": {"width": img.width, "height": img.height},
        "frameSize": {"width": frame_width, "height": frame_height},
        "grid": {"columns": cols, "rows": rows},
        "frames": frames_meta,
        "actions": action_meta,
    }
    with open(output_dir / "frames.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    return {"totalFrames": total, "columns": cols, "rows": rows}


def main() -> int:
    if len(sys.argv) < 6:
        print("usage: split_sheet.py <sheet> <output-dir> <frame-width> <frame-height> <actions-json>", file=sys.stderr)
        return 1

    sheet_path = Path(sys.argv[1]).resolve()
    output_dir = Path(sys.argv[2]).resolve()
    frame_width = int(sys.argv[3])
    frame_height = int(sys.argv[4])
    actions = json.loads(sys.argv[5])

    output_dir.mkdir(parents=True, exist_ok=True)
    result = save_frames(sheet_path, output_dir, frame_width, frame_height, actions)
    print(json.dumps({"ok": True, **result}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
