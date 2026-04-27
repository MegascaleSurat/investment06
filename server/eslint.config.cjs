const prettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js', '**/*.cjs'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      'no-console': 'off',
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      'import/no-unresolved': 'off'
    }
  },
  prettier
];
