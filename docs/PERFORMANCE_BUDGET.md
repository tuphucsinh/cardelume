# Performance Budget

Mobile p75 targets:

- LCP ≤ 2.5 s
- INP ≤ 200 ms
- CLS ≤ 0.10
- Marketing TTFB target < 500 ms
- Initial landing JS target ≤ 200 KB gzip
- Main-thread long task < 50 ms
- Core motion target ~55–60fps
- Time to first card < 60 s

## Motion

Prefer:

- transform
- opacity
- compositor-friendly reveal

Avoid continuous:

- large blur
- animated box-shadow
- full-screen moving gradients
- heavy SVG filter chains
- decorative 3D everywhere

Signature animation target:

- paper appears
- typography composes
- artwork resolves
- card lifts
- 3 directions separate
- 1.2–1.8 s
