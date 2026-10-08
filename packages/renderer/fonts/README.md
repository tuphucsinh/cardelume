# Print renderer fonts

Fonts used by `renderForPrint` (resvg -> JPEG/PDF). **resvg loads TTF/OTF/TTC only — it
cannot read the `.woff2` files that `@fontsource` ships**, and it silently draws no text
when it cannot load a face. Two sources are therefore required, and both must be listed in
`RENDER_FONT_DIRS` (see `run-web.sh` / `run-worker.sh`):

## Latin (`packages/renderer/fonts/*.ttf`)

Committed, generated from the vendored `@fontsource` packages by
`scripts/build-render-fonts.py` (requires `python3` + `fontTools`):

- the per-subset `.woff` files are converted (WOFF1 = zlib, no brotli needed) and the
  latin / latin-ext / vietnamese subsets are merged per family+weight so Vietnamese
  diacritics are covered by a single face;
- the name table is normalised (`@fontsource` keeps names such as `Cormorant Garamond
  Light`, which would never match a request for `Cormorant Garamond`);
- `scripts/build-font-metrics.py` regenerates `metrics.json` (unitsPerEm, ascent/descent,
  `codepoint -> [glyph id, advance, glyph name]`) which the PDF text layer consumes.

The families requested for Latin are `Cormorant Garamond` and `Plus Jakarta Sans` — the
same faces the on-screen preview uses, so print and screen agree.

## CJK (system package)

Japanese / Korean / Simplified Chinese are served by the **system** package
`fonts-noto-cjk`, installed at `/usr/share/fonts/opentype/noto` (`NotoSansCJK-*.ttc`,
`NotoSerifCJK-*.ttc`). The family names inside those collections (`Noto Sans CJK JP`,
`Noto Serif CJK KR`, `Noto Sans CJK SC`, …) are exactly what the renderer requests.

```bash
sudo apt-get install -y fonts-noto-cjk
```

`RENDER_FONT_DIRS` must include `/usr/share/fonts/opentype/noto`; without it the CJK
locales render text that is not real glyphs. A fresh host that skips this step will
regress ja/ko/zh silently, so keep it in the deployment prerequisites.
