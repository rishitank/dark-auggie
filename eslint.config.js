import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignore generated and vendor folders
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'logs/**'] },

  // TypeScript source files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // Keep lightweight; we don't require project service for linting
        project: false,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // General
      'no-undef': 'off', // handled by TS
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],

      // TS-centric quality rules (safe defaults)
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
    },
  },

  // Turn off rules that might conflict with Prettier
  prettier,
];
