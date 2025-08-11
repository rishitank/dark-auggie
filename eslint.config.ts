import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

// Single flat config (TypeScript) is the source of truth
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'logs/**']
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser as any,
      parserOptions: {
        project: false,
        sourceType: 'module',
        ecmaVersion: 'latest'
      }
    },
    plugins: { '@typescript-eslint': tseslint as any },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }
      ],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],

      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }]
    }
  },
  prettier as any
];
