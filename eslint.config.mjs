import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/out/**',
      '**/benchmark-results/**',
      '**/*.tsbuildinfo',
      '**/next-env.d.ts',
    ],
  },
  // Explicit P18 baseline exceptions because source refactoring is out of scope
  {
    files: [
      'app/admin/templates/template-admin.tsx',
      'components/card-studio.tsx',
      'components/physical-effects.tsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: [
      'components/card-studio.tsx',
    ],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    files: [
      'app/d/[[]recoveryId[]]/recovery-refresh.tsx',
      'lib/generation-client.ts',
    ],
    rules: {
      'prefer-const': 'off',
    },
  },
];

export default eslintConfig;
