const tseslint = require('@typescript-eslint/eslint-plugin');
// TODO: replace with eslint.config.ts per PR review

const tsParser = require('@typescript-eslint/parser');

module.exports = [
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules
    }
  }
];
