#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { checksForTier, TIER_ORDER } from '../governance/check-registry.mjs';

const root = path.resolve(import.meta.dirname, '..');
const nonFlagArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const requested = nonFlagArgs[0] || 'fast';
const tier = requested === 'status' ? 'release' : requested;
if (!TIER_ORDER.includes(tier)) {
  console.error(`Usage: node scripts/governance-runner.mjs <${TIER_ORDER.join('|')}|status>`);
  process.exit(64);
}
const verbose = process.argv.includes('--verbose');
const startedAt = Date.now();

function compact(text, max = 1200) {
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}\n…<truncated>`;
}

function runNode(check) {
  const t0 = Date.now();
  if (check.requiresWorkspaceDependencies && !fs.existsSync(path.join(root, 'node_modules'))) {
    return {
      id: check.id,
      domain: check.domain,
      declaredTier: check.tier,
      status: 'BLOCKED_RUNTIME',
      exitCode: null,
      durationMs: Date.now() - t0,
      summary: 'Workspace dependencies are not installed; run in Step18 after frozen install.',
    };
  }
  const isTs = Array.isArray(check.node) && check.node.some((arg) => typeof arg === 'string' && (arg.endsWith('.ts') || arg.endsWith('.tsx')));
  const childEnv = {
    ...process.env,
    PATH: `${path.join(root, 'node_modules/.bin')}${path.delimiter}${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ''}`,
    NODE_NO_WARNINGS: process.env.NODE_NO_WARNINGS || '1',
  };

  let command = process.execPath;
  let args = check.node;

  if (isTs) {
    const filteredArgs = check.node.filter((arg) => arg !== '--experimental-strip-types');
    const localTsx = path.join(root, 'node_modules/.bin/tsx');
    const tsxCli = path.join(root, 'node_modules/tsx/dist/cli.mjs');
    if (fs.existsSync(localTsx)) {
      command = localTsx;
      args = filteredArgs;
    } else if (fs.existsSync(tsxCli)) {
      command = process.execPath;
      args = [tsxCli, ...filteredArgs];
    } else {
      command = 'tsx';
      args = filteredArgs;
    }
  }

  let result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: childEnv,
    maxBuffer: 8 * 1024 * 1024,
  });

  if (result.error && isTs && command !== process.execPath) {
    const tsxCli = path.join(root, 'node_modules/tsx/dist/cli.mjs');
    if (fs.existsSync(tsxCli)) {
      const filteredArgs = check.node.filter((arg) => arg !== '--experimental-strip-types');
      result = spawnSync(process.execPath, [tsxCli, ...filteredArgs], {
        cwd: root,
        encoding: 'utf8',
        env: childEnv,
        maxBuffer: 8 * 1024 * 1024,
      });
    }
  }

  const passed = result.status === 0;
  const record = {
    id: check.id,
    domain: check.domain,
    declaredTier: check.tier,
    status: passed ? 'PASS' : 'FAIL',
    exitCode: result.status ?? (passed ? 0 : 1),
    durationMs: Date.now() - t0,
  };
  if (!passed || verbose) {
    record.stdout = compact(result.stdout || (result.error ? String(result.error) : ''));
    record.stderr = compact(result.stderr || '');
  } else {
    const lines = String(result.stdout || '').trim().split('\n').filter(Boolean);
    record.summary = compact(lines.slice(-4).join(' | '), 500);
  }
  return record;
}

/**
 * Validates authoritative current-runtime real browser evidence.
 * Rejects HTTP-only output (e.g. tests/browser-verify.sh) and source-string inspection.
 * Requires explicit documented runtime evidence:
 *  - Env: CARDELUME_BROWSER_EVIDENCE_PATH / BROWSER_EVIDENCE_PATH (file path)
 *  - Env: CARDELUME_BROWSER_EVIDENCE / BROWSER_EVIDENCE (inline JSON)
 *  - CLI: --browser-evidence=<path>
 *  - File: quality/governance/current-browser-evidence.json (if committed)
 * Returns BLOCKED_MISSING_BROWSER_EVIDENCE fail-closed when evidence is not provided.
 */
function evaluateBrowserEvidence() {
  const t0 = Date.now();

  let explicitPath = null;
  const argWithEq = process.argv.find((a) => a.startsWith('--browser-evidence='));
  if (argWithEq) {
    explicitPath = argWithEq.split('=')[1];
  } else {
    const idx = process.argv.indexOf('--browser-evidence');
    if (idx !== -1 && process.argv[idx + 1]) {
      explicitPath = process.argv[idx + 1];
    }
  }

  const envPath = process.env.CARDELUME_BROWSER_EVIDENCE_PATH ||
    process.env.BROWSER_EVIDENCE_PATH ||
    process.env.BROWSER_EVIDENCE_FILE;
  const rawEnvJson = process.env.CARDELUME_BROWSER_EVIDENCE || process.env.BROWSER_EVIDENCE;

  const targetPath = explicitPath || envPath;
  const candidateDefaultFiles = [
    path.join(root, 'quality/governance/current-browser-evidence.json'),
    path.join(root, '.ai/evidence/current-browser-evidence.json'),
    path.join(root, 'quality/evidence/browser-release-evidence.json'),
  ];

  let rawContent = null;
  let inputSource = null;

  if (targetPath) {
    inputSource = targetPath;
    const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(root, targetPath);
    if (!fs.existsSync(resolved)) {
      return {
        id: 'browser.real-runtime',
        status: 'FAIL',
        exitCode: 1,
        durationMs: Date.now() - t0,
        summary: `Configured browser evidence file does not exist: ${targetPath}`,
        inputSource,
      };
    }
    rawContent = fs.readFileSync(resolved, 'utf8');
  } else if (rawEnvJson) {
    inputSource = 'env:CARDELUME_BROWSER_EVIDENCE';
    rawContent = rawEnvJson;
  } else {
    for (const defaultPath of candidateDefaultFiles) {
      if (fs.existsSync(defaultPath)) {
        inputSource = path.relative(root, defaultPath);
        rawContent = fs.readFileSync(defaultPath, 'utf8');
        break;
      }
    }
  }

  if (!rawContent) {
    return {
      id: 'browser.real-runtime',
      status: 'BLOCKED_MISSING_BROWSER_EVIDENCE',
      exitCode: null,
      durationMs: Date.now() - t0,
      summary: 'Current-runtime browser evidence input required (set CARDELUME_BROWSER_EVIDENCE_PATH or CARDELUME_BROWSER_EVIDENCE); HTTP-only checks and source-string inspection cannot satisfy real-browser gate.',
      inputSource: 'none',
    };
  }

  // Reject HTTP-only smoke output or browser-verify.sh plain text
  if (
    rawContent.includes('[browser-verify]') ||
    rawContent.includes('HTTP smoke completed only') ||
    rawContent.includes('This script intentionally does not claim real browser') ||
    (/^\s*PASS\s+\/\s+->\s+HTTP\s+200/m.test(rawContent) && !rawContent.trim().startsWith('{'))
  ) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: 'Browser evidence rejected: HTTP-only output from tests/browser-verify.sh cannot satisfy real-browser gate.',
      inputSource,
    };
  }

  let evidence;
  try {
    evidence = JSON.parse(rawContent);
  } catch (err) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: `Browser evidence is malformed JSON: ${err.message}`,
      inputSource,
    };
  }

  if (typeof evidence !== 'object' || evidence === null) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: 'Browser evidence must be a JSON object.',
      inputSource,
    };
  }

  // Source-string or HTTP-only mode flags in JSON
  if (evidence.source_string_only || evidence.sourceOnly || evidence.http_only || evidence.httpOnly) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: 'Browser evidence rejected: source-string presence or HTTP-only mode cannot satisfy real-browser gate.',
      inputSource,
    };
  }

  // Real browser automation protocol check (e.g. Chrome CDP / Playwright / Puppeteer)
  const protocol = evidence.browser_protocol ||
    evidence.method ||
    evidence.engine ||
    evidence.functional_gate?.browser_protocol ||
    evidence.toolchain?.browser;
  if (!protocol || /curl|http-only|fetch-only/i.test(String(protocol))) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: 'Browser evidence rejected: missing real browser protocol (Chrome CDP / Playwright required; curl/HTTP-only rejected).',
      inputSource,
    };
  }

  // Deliberate failure verdicts
  if (evidence.status === 'FAIL' || evidence.verdict === 'FAIL' || evidence.verdict === 'NO_GO') {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: `Browser evidence recorded explicit failure: status=${evidence.status || evidence.verdict}`,
      inputSource,
    };
  }

  // Historical/mismatched provenance rejection
  if (
    evidence.status === 'SOURCE_PROVENANCE_MISMATCH' ||
    evidence.provenance_reconciliation?.status === 'SOURCE_PROVENANCE_MISMATCH' ||
    evidence.regression_gate?.status === 'SOURCE_PROVENANCE_MISMATCH'
  ) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: 'Browser evidence rejected: SOURCE_PROVENANCE_MISMATCH recorded.',
      inputSource,
    };
  }

  // Payment-off mutation guard check
  if (
    (typeof evidence.checkout_mutations === 'number' && evidence.checkout_mutations > 0) ||
    (typeof evidence.payment_mutations === 'number' && evidence.payment_mutations > 0) ||
    (evidence.functional_gate && typeof evidence.functional_gate.checkout_mutations === 'number' && evidence.functional_gate.checkout_mutations > 0)
  ) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: 'Payment-off mutation guard violated: checkout/payment mutations observed in browser evidence.',
      inputSource,
    };
  }

  // Functional gate assertions
  const fg = evidence.functional_gate;
  if (fg) {
    if (fg.status && fg.status !== 'PASS') {
      return {
        id: 'browser.real-runtime',
        status: 'FAIL',
        exitCode: 1,
        durationMs: Date.now() - t0,
        summary: `Browser functional gate failed: status=${fg.status}`,
        inputSource,
      };
    }
    if ((fg.http_errors && fg.http_errors > 0) || (fg.runtime_errors && fg.runtime_errors > 0)) {
      return {
        id: 'browser.real-runtime',
        status: 'FAIL',
        exitCode: 1,
        durationMs: Date.now() - t0,
        summary: `Browser functional gate reported errors: http_errors=${fg.http_errors || 0}, runtime_errors=${fg.runtime_errors || 0}`,
        inputSource,
      };
    }
  }

  const isPass = evidence.status === 'PASS' || evidence.verdict === 'PASS' || fg?.status === 'PASS';
  if (!isPass) {
    return {
      id: 'browser.real-runtime',
      status: 'FAIL',
      exitCode: 1,
      durationMs: Date.now() - t0,
      summary: `Browser evidence does not declare PASS (status=${evidence.status || evidence.verdict || 'undefined'})`,
      inputSource,
    };
  }

  return {
    id: 'browser.real-runtime',
    status: 'PASS',
    exitCode: 0,
    durationMs: Date.now() - t0,
    summary: `Verified real-browser evidence from ${inputSource} (protocol: ${protocol})`,
    inputSource,
  };
}

function runtimeGates(browserGate) {
  const exists = (p) => fs.existsSync(path.join(root, p));
  const advisoryNode = (id, args, passStatus = 'PASS') => {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: process.env, maxBuffer: 8 * 1024 * 1024 });
    return {
      id,
      status: r.status === 0 ? passStatus : 'NO_GO',
      exitCode: r.status,
      durationMs: Date.now() - t0,
      evidence: compact(r.status === 0 ? r.stdout : `${r.stdout}\n${r.stderr}`, 800),
      mandatoryForProduction: true,
    };
  };
  const gates = [
    advisoryNode('release.ip-provenance', ['scripts/ip-governance.mjs', 'release-check']),
    advisoryNode('release.security', ['scripts/security-governance.mjs', 'release-check']),
    advisoryNode('release.font-template-quality', ['scripts/font-template-launch-readiness.mjs']),
    advisoryNode('release.secret-scan', ['scripts/security-governance.mjs', 'secret-scan']),
    advisoryNode('release.source-sbom', ['scripts/security-governance.mjs', 'sbom-source']),
    { id: 'dependency.lock', status: exists('pnpm-lock.yaml') ? 'PRESENT' : 'BLOCKED', mandatoryForProduction: true },
    { id: 'owner.brand-asset-attestation', status: 'OWNER_ACTION_REQUIRED', mandatoryForProduction: true },
    { id: 'owner.template-premium-originality', status: 'HUMAN_REVIEW_REQUIRED', mandatoryForProduction: true },
    { id: 'owner.legal-native-language', status: process.env.LEGAL_CONTENT_APPROVED === 'true' ? 'CONFIGURED_NOT_RUNTIME_VERIFIED' : 'OWNER_ACTION_REQUIRED', mandatoryForProduction: true },
    { id: 'runtime.real-golden-model', status: 'NOT_EXECUTED', mandatoryForProduction: true },
    { id: 'runtime.staging-db-r2-pgboss-dodo', status: 'NOT_EXECUTED', mandatoryForProduction: true },
    {
      id: 'runtime.browser-accessibility-performance-csp',
      status: browserGate ? browserGate.status : 'NOT_EXECUTED',
      evidence: browserGate ? browserGate.summary : undefined,
      mandatoryForProduction: true,
    },
    { id: 'runtime.pi5-oracle-ha-restore', status: 'DEFERRED_TO_PI5', mandatoryForProduction: true },
  ];

  if (tier === 'heavy') {
    if (!exists('pnpm-lock.yaml')) {
      gates.push({ id: 'runtime.frozen-build', status: 'BLOCKED_BY_DEPENDENCY_LOCK', mandatoryForProduction: true });
    } else if (process.env.CARDELUME_RUN_FROZEN_BUILD !== '1') {
      gates.push({ id: 'runtime.frozen-build', status: 'READY_NOT_REQUESTED', mandatoryForProduction: true, hint: 'Set CARDELUME_RUN_FROZEN_BUILD=1 in a controlled non-production runtime.' });
    } else {
      const commands = [
        ['corepack', ['pnpm', 'install', '--frozen-lockfile']],
        ['corepack', ['pnpm', 'typecheck']],
        ['corepack', ['pnpm', 'build']],
        ['corepack', ['pnpm', 'test']],
      ];
      for (const [cmd, args] of commands) {
        const t0 = Date.now();
        const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: process.env, maxBuffer: 16 * 1024 * 1024 });
        gates.push({
          id: `runtime.${args.join('-')}`,
          status: r.status === 0 ? 'PASS' : 'FAIL',
          exitCode: r.status,
          durationMs: Date.now() - t0,
          evidence: r.status === 0 ? compact(r.stdout, 500) : compact(`${r.stdout}\n${r.stderr}`, 1200),
          mandatoryForProduction: true,
        });
        if (r.status !== 0) break;
      }
    }
  }
  return gates;
}

const checks = checksForTier(tier);
const results = [];
for (const check of checks) {
  const result = runNode(check);
  results.push(result);
  const marker = result.status === 'PASS' ? '✓' : result.status === 'BLOCKED_RUNTIME' ? '○' : '✗';
  console.log(`${marker} ${result.id} (${result.durationMs}ms)`);
  if (result.status === 'FAIL' && tier === 'fast') break;
}

const failed = results.filter((r) => r.status === 'FAIL');

// Evaluate browser evidence gate for RELEASE / HEAVY / STATUS tiers
const isReleaseOrAbove = tier === 'release' || tier === 'heavy';
const browserGate = isReleaseOrAbove
  ? evaluateBrowserEvidence()
  : { id: 'browser.real-runtime', status: 'NOT_EVALUATED_IN_FAST_TIER', durationMs: 0, summary: 'Skipped in fast tier' };

if (isReleaseOrAbove) {
  const browserMarker = browserGate.status === 'PASS' ? '✓' : browserGate.status.startsWith('BLOCKED') ? '○' : '✗';
  console.log(`${browserMarker} ${browserGate.id} (${browserGate.status})`);
  if (browserGate.status === 'FAIL') {
    failed.push(browserGate);
  }
}

const rootResults = [];
let rootHasFailure = false;
let totalRootDurationMs = 0;

if (isReleaseOrAbove) {
  let shimDir = null;
  try {
    shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cardelume-pnpm-shim-'));
    const shimFile = path.join(shimDir, 'pnpm');
    fs.writeFileSync(shimFile, '#!/bin/sh\nexec /usr/bin/corepack pnpm "$@"\n', { mode: 0o755 });
    fs.chmodSync(shimFile, 0o755);
    const childEnv = {
      ...process.env,
      PATH: `${shimDir}${path.delimiter}${process.env.PATH || ''}`,
    };

    const rootCommands = ['test', 'lint', 'typecheck', 'build'];
    for (const cmd of rootCommands) {
      const t0 = Date.now();
      const r = spawnSync('corepack', ['pnpm', cmd], {
        cwd: root,
        encoding: 'utf8',
        env: childEnv,
        maxBuffer: 16 * 1024 * 1024,
      });
      const durationMs = Date.now() - t0;
      totalRootDurationMs += durationMs;
      const passed = r.status === 0;
      const record = {
        command: cmd,
        status: passed ? 'PASS' : 'FAIL',
        exitCode: r.status ?? (passed ? 0 : 1),
        durationMs,
      };
      if (!passed || verbose) {
        record.stdout = compact(r.stdout);
        record.stderr = compact(r.stderr);
      }
      rootResults.push(record);
      const marker = passed ? '✓' : '✗';
      console.log(`${marker} root.${cmd} (${durationMs}ms)`);
      if (!passed) {
        rootHasFailure = true;
        failed.push({
          id: `root.${cmd}`,
          domain: 'root',
          declaredTier: tier,
          status: 'FAIL',
          exitCode: record.exitCode,
          durationMs,
          summary: `corepack pnpm ${cmd} failed with exit code ${record.exitCode}`,
        });
        break;
      }
    }
  } finally {
    if (shimDir) {
      try {
        fs.rmSync(shimDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }
}

const rootAllPassed = isReleaseOrAbove && !rootHasFailure && rootResults.length === 4 && rootResults.every((r) => r.status === 'PASS');

const rendererCheck = results.find((r) => r.id === 'render.export-stress');
const semanticExportCheck = results.find((r) => r.id === 'render.beta-export-matrix');

let releaseProductCorrectnessGate = 'PASS';
if (!isReleaseOrAbove) {
  releaseProductCorrectnessGate = 'NOT_EVALUATED_IN_FAST_TIER';
} else if (
  rendererCheck?.status === 'FAIL' ||
  semanticExportCheck?.status === 'FAIL' ||
  browserGate.status === 'FAIL' ||
  rootHasFailure
) {
  releaseProductCorrectnessGate = 'FAIL';
} else if (
  !rendererCheck || rendererCheck.status !== 'PASS' ||
  !semanticExportCheck || semanticExportCheck.status !== 'PASS' ||
  browserGate.status !== 'PASS' ||
  !rootAllPassed
) {
  if (browserGate.status.startsWith('BLOCKED')) {
    releaseProductCorrectnessGate = browserGate.status;
  } else if (rendererCheck?.status?.startsWith('BLOCKED')) {
    releaseProductCorrectnessGate = rendererCheck.status;
  } else if (semanticExportCheck?.status?.startsWith('BLOCKED')) {
    releaseProductCorrectnessGate = semanticExportCheck.status;
  } else {
    releaseProductCorrectnessGate = 'BLOCKED';
  }
}

const gates = runtimeGates(isReleaseOrAbove ? browserGate : null);
const sourceVerdict = failed.length ? 'FAIL' : 'PASS';
const productionOpenGates = gates.filter((g) => g.mandatoryForProduction && g.status !== 'PASS');
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  candidate: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
  requestedMode: requested,
  executedTier: tier,
  sourceVerdict,
  productionVerdict: sourceVerdict === 'PASS' && productionOpenGates.length === 0 ? 'GO_FOR_OWNER_APPROVAL' : 'NO_GO_UNTIL_RUNTIME_AND_OWNER_GATES',
  RELEASE_PRODUCT_CORRECTNESS_GATE: releaseProductCorrectnessGate,
  productCorrectness: {
    status: releaseProductCorrectnessGate,
    checks: {
      renderer: {
        id: rendererCheck?.id || 'render.export-stress',
        status: rendererCheck?.status || 'MISSING',
        durationMs: rendererCheck?.durationMs,
        summary: rendererCheck?.summary,
      },
      semanticExport: {
        id: semanticExportCheck?.id || 'render.beta-export-matrix',
        status: semanticExportCheck?.status || 'MISSING',
        durationMs: semanticExportCheck?.durationMs,
        summary: semanticExportCheck?.summary,
      },
      browser: {
        id: browserGate.id,
        status: browserGate.status,
        durationMs: browserGate.durationMs,
        summary: browserGate.summary,
        inputSource: browserGate.inputSource,
      },
      root: isReleaseOrAbove ? {
        id: 'root.commands',
        status: rootAllPassed ? 'PASS' : 'FAIL',
        durationMs: totalRootDurationMs,
        summary: rootResults.map((r) => `${r.command}:${r.status}`).join(' | '),
        commands: rootResults,
        results: rootResults,
        checks: Object.fromEntries(rootResults.map((r) => [r.command, r.status])),
        test: rootResults.find((r) => r.command === 'test') || { command: 'test', status: rootHasFailure ? 'NOT_RUN' : 'MISSING' },
        lint: rootResults.find((r) => r.command === 'lint') || { command: 'lint', status: rootHasFailure ? 'NOT_RUN' : 'MISSING' },
        typecheck: rootResults.find((r) => r.command === 'typecheck') || { command: 'typecheck', status: rootHasFailure ? 'NOT_RUN' : 'MISSING' },
        build: rootResults.find((r) => r.command === 'build') || { command: 'build', status: rootHasFailure ? 'NOT_RUN' : 'MISSING' },
      } : {
        id: 'root.commands',
        status: 'NOT_EVALUATED_IN_FAST_TIER',
        durationMs: 0,
        summary: 'Skipped in fast tier',
        commands: [],
        results: [],
        checks: {},
      },
    },
  },
  durationMs: Date.now() - startedAt,
  checksPlanned: checks.length,
  checksExecuted: results.length,
  checks: results,
  runtimeAndOwnerGates: gates,
  principles: [
    'FAST is for frequent source changes.',
    'RELEASE is the authoritative source/offline promotion suite.',
    'HEAVY adds deterministic render stress and optionally frozen build checks; real service/HA evidence remains Step18/19.',
    'A missing mandatory production gate never becomes PASS by source appearance or owner pressure.',
    'RELEASE_PRODUCT_CORRECTNESS_GATE wires real root checks, real renderer stress, semantic export matrix, and real browser evidence fail-closed.',
  ],
};

const outDir = path.join(root, 'quality/governance');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `LATEST_${requested.toUpperCase()}.json`);
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${sourceVerdict} ${requested.toUpperCase()} in ${report.durationMs}ms; report=${path.relative(root, out)}`);
if (isReleaseOrAbove) {
  console.log(`RELEASE_PRODUCT_CORRECTNESS_GATE: ${report.RELEASE_PRODUCT_CORRECTNESS_GATE}`);
}
console.log(`Production: ${report.productionVerdict}`);
if (failed.length || (isReleaseOrAbove && releaseProductCorrectnessGate !== 'PASS')) {
  process.exit(1);
}
if (requested === 'heavy' && productionOpenGates.length) process.exitCode = 2;
