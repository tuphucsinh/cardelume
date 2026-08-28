#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { checksForTier, TIER_ORDER } from '../governance/check-registry.mjs';

const root = path.resolve(import.meta.dirname, '..');
const requested = process.argv[2] || 'fast';
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
  const result = spawnSync(process.execPath, check.node, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: process.env.NODE_NO_WARNINGS || '1' },
    maxBuffer: 8 * 1024 * 1024,
  });
  const passed = result.status === 0;
  const record = {
    id: check.id,
    domain: check.domain,
    declaredTier: check.tier,
    status: passed ? 'PASS' : 'FAIL',
    exitCode: result.status,
    durationMs: Date.now() - t0,
  };
  if (!passed || verbose) {
    record.stdout = compact(result.stdout);
    record.stderr = compact(result.stderr);
  } else {
    const lines = String(result.stdout || '').trim().split('\n').filter(Boolean);
    record.summary = compact(lines.slice(-4).join(' | '), 500);
  }
  return record;
}

function runtimeGates() {
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
    { id: 'runtime.browser-accessibility-performance-csp', status: 'NOT_EXECUTED', mandatoryForProduction: true },
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
  if (result.status === 'FAIL') break; // fail fast on actual regression; runtime-blocked HEAVY checks remain explicit gates.
}

const failed = results.filter((r) => r.status === 'FAIL');
const gates = runtimeGates();
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
  ],
};

const outDir = path.join(root, 'quality/governance');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `LATEST_${requested.toUpperCase()}.json`);
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${sourceVerdict} ${requested.toUpperCase()} in ${report.durationMs}ms; report=${path.relative(root, out)}`);
console.log(`Production: ${report.productionVerdict}`);
if (failed.length) process.exit(1);
if (requested === 'heavy' && productionOpenGates.length) process.exitCode = 2;
