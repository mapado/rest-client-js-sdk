import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  {
    ignores: ['dist/'],
  },
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          ts: 'never',
          jsx: 'never',
          tsx: 'never',
        },
      ],
      // sort imports. see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
      // TLDR; sorted by : ['react', 'external packages', 'mapado packages', 'internal']
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc' },
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before',
            },
            {
              pattern: '@mapado/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: 'mapado-*',
              group: 'external',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
        },
      ],

      'new-cap': [
        'error',
        {
          newIsCap: true,
          capIsNew: false,
        },
      ],
      'no-underscore-dangle': [
        'error',
        {
          allowAfterThis: true,
          allow: ['_groups'],
        },
      ],
    },
  },
  {
    files: ['__tests__/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  // disable rules that conflict with prettier — must stay last
  prettierConfig,
];
