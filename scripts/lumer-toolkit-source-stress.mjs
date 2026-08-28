#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const requiredSkills = [
  'creative/cardelume-template-author',
  'creative/cardelume-premium-review',
  'creative/cardelume-template-portfolio',
  'creative/cardelume-market-adaptation',
  'creative/cardelume-publish-qa',
  'operations/lume-project-health',
  'operations/lume-release-audit',
  'operations/lume-experiment-manager',
  'operations/lume-incident-response',
  'operations/lume-backup-restore-audit',
  'research/lume-market-intelligence',
  'research/lume-competitive-pricing',
  'research/lume-visual-reference-scout',
  'assurance/lume-ip-copyright-audit',
  'assurance/lume-security-audit',
  'assurance/lume-localization-qa',
  'analytics/lume-ai-economics',
  'analytics/lume-product-effectiveness',
];
const requiredExtraSkills = [
  'operations/lume-project-audit',
  'operations/lume-performance-audit',
  'operations/lume-staging-release',
  'operations/lume-production-readiness',
  'assurance/lume-dependency-security',
  'assurance/lume-asset-provenance-audit',
  'analytics/lume-analytics-review',
];
const requiredHeadings = [
  '## When to use',
  '## Allowed data',
  '## Authority and write boundary',
  '## Procedure',
  '## Failure / stop conditions',
  '## Verification',
  '## Outputs',
  '## References',
];
const requiredMeta = ['**version:**', '**owner:**', '**category:**', '**risk:**', '**production_authority:**'];
const requiredPolicies = [
  '.lumer/policies/AUTHORITY_MATRIX.md',
  '.lumer/policies/DATA_MEMORY_POLICY.md',
  '.lumer/policies/PRODUCTION_CHANGE_POLICY.md',
  '.lumer/policies/RESEARCH_IP_POLICY.md',
  '.lumer/policies/SKILL_TRUST_POLICY.md',
  '.lumer/policies/CONCURRENCY_AND_STATE_POLICY.md',
];
const requiredBundles = ['lume-daily.md','lume-template.md','lume-release.md','lume-research.md','lume-incident.md','lume-benchmark.md'];
const requiredWorkflows = ['template-authoring.md','release-readiness.md','incident-response.md','benchmark-model-comparison.md','market-research.md'];
const requiredContext = ['SOURCE_OF_TRUTH.md','CURRENT_BASELINE.md','PRODUCTION_BOUNDARIES.md','LUMER_BOOTSTRAP_CHECKLIST.md'];

const failures = [];
const passes = [];
function assert(condition, message) {
  if (!condition) failures.push(message); else passes.push(message);
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }

const pkg = JSON.parse(read('package.json'));
assert(/^0\.4\.3-step\.(?:1[5-9]|[2-9][0-9]+)(?:[a-z])?$/.test(pkg.version), 'package version retains Step 15+ toolkit baseline');
const governanceRegistry = read('governance/check-registry.mjs');
assert(governanceRegistry.includes('scripts/lumer-toolkit-source-stress.mjs'), 'toolkit validator is wired in governance registry');

for (const skill of [...requiredSkills, ...requiredExtraSkills]) {
  const rel = `.hermes/skills/${skill}/SKILL.md`;
  assert(exists(rel), `${rel} exists`);
  if (!exists(rel)) continue;
  const text = read(rel);
  for (const h of requiredHeadings) assert(text.includes(h), `${skill} contains ${h}`);
  for (const m of requiredMeta) assert(text.includes(m), `${skill} contains ${m}`);
  const prod = /\*\*production_authority:\*\*\s*approval-required/i.test(text);
  if (prod) assert(/owner approval|owner-approved|explicit owner/i.test(text), `${skill} states owner approval boundary`);
  assert(!/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/.test(text), `${skill} contains no private key material`);
  assert(!/\bsk-[A-Za-z0-9_-]{20,}\b/.test(text), `${skill} contains no obvious API secret literal`);
}

for (const rel of requiredPolicies) assert(exists(rel), `${rel} exists`);
for (const f of requiredBundles) assert(exists(`.lumer/bundle-templates/${f}`), `bundle ${f} exists`);
for (const f of requiredWorkflows) assert(exists(`.hermes/workflows/${f}`), `workflow ${f} exists`);
for (const f of requiredContext) assert(exists(`.hermes/project-context/${f}`), `project context ${f} exists`);

const authority = read('.lumer/policies/AUTHORITY_MATRIX.md');
assert(/Promote production[\s\S]*owner approval required/i.test(authority), 'authority matrix gates production promotion');
assert(/Irreversible[\s\S]*explicit owner approval/i.test(authority), 'authority matrix gates irreversible actions');
assert(/Missing evidence is `UNKNOWN`, not PASS/i.test(authority), 'authority matrix is fail-closed');

const memory = read('.lumer/policies/DATA_MEMORY_POLICY.md');
assert(/customer card messages/i.test(memory) && /uploaded photos/i.test(memory), 'memory policy blocks shadow customer-content memory');
assert(/credentials/i.test(memory), 'memory policy excludes credentials');

const research = read('.lumer/policies/RESEARCH_IP_POLICY.md');
assert(/reference.*abstract insight.*original CardeLume creative thesis/i.test(research), 'research policy enforces abstract-insight originality flow');
assert(/Unknown provenance\/license means reject/i.test(research), 'research policy rejects unknown provenance');

const templateAuthor = read('.hermes/skills/creative/cardelume-template-author/SKILL.md');
assert(/Never inject arbitrary model-authored CSS\/SVG/i.test(templateAuthor), 'template author preserves trusted renderer boundary');
assert(/Unknown provenance means stop/i.test(templateAuthor), 'template author fails closed on provenance');

const premiumReview = read('.hermes/skills/creative/cardelume-premium-review/SKILL.md');
assert(/premium and WOW are visible separately/i.test(premiumReview), 'premium review keeps premium/WOW visible');
assert(/AI-generic/i.test(premiumReview), 'premium review checks AI-generic aesthetics');

const releaseAudit = read('.hermes/skills/operations/lume-release-audit/SKILL.md');
assert(/Any mandatory missing\/failed gate => NO_GO/i.test(releaseAudit), 'release audit is fail-closed');
assert(/GO_FOR_OWNER_APPROVAL/i.test(releaseAudit), 'release audit stops at owner approval package');

const ipAudit = read('.hermes/skills/assurance/lume-ip-copyright-audit/SKILL.md');
assert(/UNKNOWN is treated as REJECTED/i.test(ipAudit), 'IP audit maps UNKNOWN to rejected');

const security = read('.hermes/skills/assurance/lume-security-audit/SKILL.md');
assert(/OWASP ASVS 5\.0 Level 2/i.test(security), 'security audit targets ASVS 5.0 L2');
assert(/No destructive production exploitation/i.test(security), 'security audit forbids destructive production exploitation');

const economics = read('.hermes/skills/analytics/lume-ai-economics/SKILL.md');
assert(/quality remains above approved floor/i.test(economics), 'AI economics does not trade away premium floor');

const bootstrap = read('.hermes/project-context/LUMER_BOOTSTRAP_CHECKLIST.md');
assert(/hermes profile create lumer/i.test(bootstrap), 'Pi bootstrap creates dedicated lumer profile');
assert(/hermes skills trust/i.test(bootstrap), 'Pi bootstrap requires explicit project skill trust');
assert(/no production writes/i.test(bootstrap), 'bootstrap validation prohibits production writes');

console.log(`Lumer Toolkit source stress: ${failures.length ? 'FAIL' : 'PASS'}`);
console.log(`Checks passed: ${passes.length}`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(1);
}
console.log(`Canonical skills: ${requiredSkills.length}; operational companion skills: ${requiredExtraSkills.length}; total: ${requiredSkills.length + requiredExtraSkills.length}`);
