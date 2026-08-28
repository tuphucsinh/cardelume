# Tests

Most source/regression probes remain under `scripts/` and are orchestrated by `governance/check-registry.mjs`.

Hermes standard browser entry point:

```bash
BASE_URL=http://127.0.0.1:3000 bash tests/browser-verify.sh
```

The shell script provides HTTP/security-header smoke checks and may invoke committed browser automation when available. It must not be treated as full browser/a11y/performance evidence unless a real browser suite actually ran.
