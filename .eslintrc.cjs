/**
 * ESLint config for the Grimorio monorepo.
 *
 * The headline rule is the clean-architecture boundary enforcement:
 *   domain/**      MUST NOT import from application/**, infra/**, transport/**, or node:*
 *   application/** MUST NOT import from infra/** or transport/**
 *
 * This mechanically guarantees the hexagonal layering described in SPEC.md §4.
 */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.cjs'],
  rules: {
    // Allow intentionally-unused args/vars prefixed with `_` (e.g. fake Rng(_min,_max)).
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './backend/src/domain',
            from: './backend/src/application',
            message: 'domain/** must not import from application/** (clean-arch boundary).',
          },
          {
            target: './backend/src/domain',
            from: './backend/src/infra',
            message: 'domain/** must not import from infra/** (clean-arch boundary).',
          },
          {
            target: './backend/src/domain',
            from: './backend/src/transport',
            message: 'domain/** must not import from transport/** (clean-arch boundary).',
          },
          {
            target: './backend/src/application',
            from: './backend/src/infra',
            message: 'application/** must not import from infra/** (clean-arch boundary).',
          },
          {
            target: './backend/src/application',
            from: './backend/src/transport',
            message: 'application/** must not import from transport/** (clean-arch boundary).',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // The pure domain layer may not touch Node builtins (no I/O).
      files: ['backend/src/domain/**/*.ts'],
      excludedFiles: ['**/*.test.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['node:*', 'fs', 'path', 'crypto', 'os', 'http', 'net'],
                message: 'domain/** is pure: no Node builtins / I/O allowed.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
