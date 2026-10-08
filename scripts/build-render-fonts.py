"""Build full-coverage TTF faces for the CardeLume print renderer.

resvg-js cannot load the .woff2 files vendored by @fontsource, so the production export
rasterized no text. This converts the shipped per-subset .woff files (WOFF1 = zlib, no
brotli needed) into plain TTF, merges latin / latin-ext / vietnamese per family+weight so
Vietnamese diacritics are covered by one face, and normalises the name table so fontdb can
match the base family with the correct weight/style (fontsource keeps names such as
"Cormorant Garamond Light" that would never match a request for "Cormorant Garamond").
"""
import sys
from pathlib import Path

from fontTools.merge import Merger
from fontTools.ttLib import TTFont

SRC = Path("/home/pi5/projects/cardelume-fastship-clone/apps/web/node_modules/@fontsource")
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/pi5/.config/cardelume/render-fonts")
OUT.mkdir(parents=True, exist_ok=True)

FAMILIES = {
    "cormorant-garamond": ("Cormorant Garamond", "CormorantGaramond"),
    "plus-jakarta-sans": ("Plus Jakarta Sans", "PlusJakartaSans"),
}
SUBSETS = ["latin", "latin-ext", "vietnamese"]
WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold"}
STYLES = {"normal": ("Regular", 0), "italic": ("Italic", 1)}

report = []
for pkg, (family, ps_family) in FAMILIES.items():
    for weight, subfamily in WEIGHTS.items():
        for style, (style_tag, mac_style) in STYLES.items():
            parts = []
            for sub in SUBSETS:
                w = SRC / pkg / "files" / f"{pkg}-{sub}-{weight}-{style}.woff"
                if not w.exists():
                    continue
                t = OUT / f".part-{pkg}-{sub}-{weight}-{style}.ttf"
                f = TTFont(w.as_posix())
                f.flavor = None
                f.save(t.as_posix())
                parts.append(t)
            if not parts:
                continue
            dest = OUT / f"{pkg}-{weight}-{style}.ttf"
            if len(parts) == 1:
                dest.write_bytes(parts[0].read_bytes())
            else:
                try:
                    Merger().merge([p.as_posix() for p in parts]).save(dest.as_posix())
                except Exception as e:
                    dest.write_bytes(parts[-1].read_bytes())
                    report.append({"face": dest.name, "merge_error": str(e)[:80]})
            for p in parts:
                p.unlink(missing_ok=True)

            tt = TTFont(dest.as_posix())
            full = f"{family} {subfamily}" if style == "normal" else f"{family} {subfamily} Italic"
            ps = f"{ps_family}-{subfamily}" if style == "normal" else f"{ps_family}-{subfamily}Italic"
            name = tt["name"]
            for nid, val in ((1, family), (2, subfamily if style == "normal" else f"{subfamily} Italic"),
                             (3, f"{ps}:{family}:{weight}"), (4, full), (6, ps),
                             (16, family), (17, "Regular" if style == "normal" else "Italic")):
                name.setName(val, nid, 3, 1, 0x409)
                name.setName(val, nid, 1, 0, 0)
            tt["OS/2"].usWeightClass = weight
            hdr = tt["head"]
            hdr.macStyle = mac_style
            tt.save(dest.as_posix())

            chk = TTFont(dest.as_posix())
            report.append({
                "file": dest.name, "bytes": dest.stat().st_size,
                "glyphs": chk["maxp"].numGlyphs,
                "family": chk["name"].getDebugName(1),
                "subfamily": chk["name"].getDebugName(2),
                "weight": chk["OS/2"].usWeightClass,
            })

for r in report:
    print(r)
print("OUT_DIR", OUT, "files", len(list(OUT.glob('*.ttf'))))
