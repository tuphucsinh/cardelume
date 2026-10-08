"""Emit deterministic font metrics for the print PDF text layer.

The PDF writer needs, per embedded face: unitsPerEm, ascent/descent/capHeight (for the
font descriptor and baseline), plus codepoint -> (glyph id, advance width). Precomputing
this as JSON keeps the Node runtime free of a TTF parser and keeps the output byte-stable.

Run alongside build-render-fonts.py; both outputs are committed.
"""
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

FONTS = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/pi5/.config/cardelume/render-fonts")
out = {}
for ttf in sorted(FONTS.glob("*.ttf")):
    f = TTFont(ttf.as_posix())
    upm = f["head"].unitsPerEm
    hmtx = f["hmtx"]
    cmap = f.getBestCmap()
    order = f.getGlyphOrder()
    name = f["name"].getDebugName(1)
    sub = f["name"].getDebugName(2)
    os2 = f["OS/2"]
    chars = {}
    for cp, gname in cmap.items():
        try:
            adv = hmtx[gname][0]
        except Exception:
            continue
        chars[str(cp)] = [order.index(gname), adv, gname]
    out[ttf.stem] = {
        "family": name,
        "subfamily": sub,
        "unitsPerEm": upm,
        "ascent": int(os2.sTypoAscender),
        "descent": int(os2.sTypoDescender),
        "capHeight": int(getattr(os2, "sCapHeight", 0) or int(upm * 0.7)),
        "bbox": [int(f["head"].xMin), int(f["head"].yMin), int(f["head"].xMax), int(f["head"].yMax)],
        "chars": chars,
    }
    print(ttf.name, "upm", upm, "glyphs", len(chars), "family", name)

dest = FONTS / "metrics.json"
dest.write_text(json.dumps(out, sort_keys=True, separators=(",", ":")))
print("WROTE", dest, dest.stat().st_size, "bytes")
