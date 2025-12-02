import js from "@eslint/js";
import perfectionist from 'eslint-plugin-perfectionist'
import pluginReact from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";


export default defineConfig([
  globalIgnores(['.local', 'dist']),
  {
    extends: [
      // "js/recommended",
      // perfectionist.configs['recommended-alphabetical'],
      // tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      pluginReact.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {...globals.browser, ...globals.node},
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
      reportUnusedInlineConfigs: 'warn',
    },
    name: "main",
    plugins: {
      // js,
      perfectionist,
    },
    rules: {
			// "no-undef": "warn",
			// "no-unused-vars": "warn",
      'perfectionist/sort-imports': 'error',
      // 'perfectionist/sort-interfaces': ['error'],
      // 'perfectionist/sort-objects': ['error', {
      //   type: 'alphabetical',
      // }],
		},
    settings: {
      perfectionist: {
        type: 'natural',
      },
    },
  },
]);
