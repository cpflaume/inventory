import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

// Flat config (erforderlich ab ESLint 9/10). Bildet die frühere .eslintrc.cjs
// 1:1 ab: eslint:recommended + @typescript-eslint/recommended, die beiden
// klassischen react-hooks-Regeln und react-refresh.
export default [
  { ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts'] },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.browser },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript löst Bezeichner/Typen selbst auf; das Kern-no-undef würde
      // sonst auf Globals wie `process`, `React` oder `RequestInit` anschlagen.
      'no-undef': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
