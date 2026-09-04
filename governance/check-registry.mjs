export const CHECKS = [
  // FAST: cheap invariants on every meaningful source change.
  { id: 'product.integration', tier: 'fast', domain: 'product', node: ['scripts/step17j-integration-source-stress.mjs'] },
  { id: 'product.visual-directions', tier: 'fast', domain: 'product', node: ['scripts/web-visual-direction-source-stress.mjs'] },
  { id: 'product.ux-contract', tier: 'fast', domain: 'product', node: ['scripts/product-ux-source-stress.mjs'] },
  { id: 'creative.director-authority', tier: 'fast', domain: 'creative', node: ['--experimental-strip-types', 'scripts/ai-creative-director-source-stress.ts'] },
  { id: 'commerce.payment-boundary', tier: 'fast', domain: 'commerce', node: ['--experimental-strip-types', 'scripts/payment-boundary-source-stress.ts'] },
  { id: 'media.photo-upload-boundary', tier: 'fast', domain: 'media', node: ['--experimental-strip-types', 'scripts/photo-upload-boundary-stress.ts'] },
  { id: 'runtime.generation-queue-boundary', tier: 'fast', domain: 'runtime', node: ['--experimental-strip-types', 'scripts/generation-queue-source-stress.ts'] },
  { id: 'templates.catalog-source', tier: 'fast', domain: 'templates', node: ['--experimental-strip-types', 'scripts/template-library-source-stress.ts'] },

  // RELEASE: source/offline gates before staging/promotion. Includes FAST.
  { id: 'templates.catalog-runtime', tier: 'release', domain: 'templates', node: ['--experimental-strip-types', 'scripts/template-library-stress.ts'] },
  { id: 'templates.event-capability', tier: 'release', domain: 'templates', node: ['scripts/template-event-capability-stress.mjs'] },
  { id: 'templates.production-standard', tier: 'release', domain: 'templates', node: ['scripts/font-template-production-standard-stress.mjs'] },
  { id: 'templates.font-governance', tier: 'release', domain: 'templates', node: ['scripts/font-template-governance-source-stress.mjs'] },
  { id: 'templates.portfolio-v2', tier: 'release', domain: 'templates', node: ['--experimental-strip-types', 'scripts/template-portfolio-v2-source-stress.mjs'] },
  { id: 'templates.multilingual-layout', tier: 'release', domain: 'templates', node: ['--experimental-strip-types', 'scripts/template-v2-multilingual-stress.mjs'] },
  { id: 'templates.experimental-contract', tier: 'release', domain: 'templates', node: ['experiments/template-concepts/experimental-template-source-stress.mjs'] },
  { id: 'ip.provenance', tier: 'release', domain: 'ip', node: ['scripts/ip-copyright-source-stress.mjs'] },
  { id: 'security.governance', tier: 'release', domain: 'security', node: ['scripts/security-governance-source-stress.mjs'] },
  { id: 'security.launch-retention', tier: 'release', domain: 'security', node: ['--experimental-strip-types', 'scripts/launch-security-retention-stress.mjs'] },
  { id: 'experiment.isolation', tier: 'release', domain: 'experiment', node: ['scripts/experiment-staging-source-stress.mjs'] },
  { id: 'operations.readiness', tier: 'release', domain: 'operations', node: ['--experimental-strip-types', 'scripts/production-operations-source-stress.ts'] },
  { id: 'operations.backup-restore-source', tier: 'release', domain: 'operations', node: ['--experimental-strip-types', 'scripts/backup-restore-source-stress.ts'] },
  { id: 'operations.container-reproducibility', tier: 'release', domain: 'operations', node: ['scripts/reproducible-container-source-stress.mjs'] },
  { id: 'operations.pre-pi-deployment', tier: 'release', domain: 'operations', node: ['scripts/pre-pi5-deployment-source-stress.mjs'] },
  { id: 'commerce.dodo-crypto-contract', tier: 'release', domain: 'commerce', node: ['--experimental-strip-types', 'scripts/dodo-payment-contract-stress.ts'] },
  { id: 'runtime.generation-fallback', tier: 'release', domain: 'runtime', node: ['--experimental-strip-types', 'scripts/generation-fallback-stress.ts'] },
  { id: 'runtime.recovery-security', tier: 'release', domain: 'runtime', node: ['--experimental-strip-types', 'scripts/recovery-security-stress.ts'] },
  { id: 'operator.lumer-toolkit', tier: 'release', domain: 'operator', node: ['scripts/lumer-toolkit-source-stress.mjs'] },
  { id: 'quality.premium-benchmark-contract', tier: 'release', domain: 'quality', node: ['scripts/premium-benchmark-source-stress.mjs'] },
  { id: 'render.export-stress', tier: 'release', domain: 'render', requiresWorkspaceDependencies: true, node: ['--experimental-strip-types', 'scripts/renderer-export-stress.ts'] },
  { id: 'render.beta-export-matrix', tier: 'release', domain: 'render', requiresWorkspaceDependencies: true, node: ['--experimental-strip-types', 'scripts/beta-export-matrix-stress.ts'] },

  // HEAVY: deterministic stress/render checks. Controlled runtime/build gates are appended by the runner.
  { id: 'render.typography-stress', tier: 'heavy', domain: 'render', requiresWorkspaceDependencies: true, node: ['--experimental-strip-types', 'scripts/typography-stress.ts'] },
  { id: 'render.locale-detection', tier: 'heavy', domain: 'render', requiresWorkspaceDependencies: true, node: ['--experimental-strip-types', 'scripts/locale-detection-stress.ts'] },
  { id: 'render.typography-guard', tier: 'heavy', domain: 'render', requiresWorkspaceDependencies: true, node: ['--experimental-strip-types', 'scripts/typography-guard-stress.ts'] },
  { id: 'render.photo-contrast', tier: 'heavy', domain: 'render', node: ['--experimental-strip-types', 'scripts/photo-palette-contrast-stress.ts'] },
];

export const TIER_ORDER = ['fast', 'release', 'heavy'];

export function checksForTier(tier) {
  const max = TIER_ORDER.indexOf(tier);
  if (max < 0) throw new Error(`unknown_governance_tier:${tier}`);
  return CHECKS.filter((check) => TIER_ORDER.indexOf(check.tier) <= max);
}
