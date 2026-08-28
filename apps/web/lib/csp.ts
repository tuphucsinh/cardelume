export function buildCsp(nonce:string){
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // React still uses controlled inline style attributes in a few card preview paths.
    // Script execution, the higher-risk boundary, is nonce-gated and has no unsafe-inline.
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ].join("; ");
}
