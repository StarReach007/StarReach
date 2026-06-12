import js from '@eslint/js'
import globals from 'globals'

// Flat config (ESLint v9). `make lint-js` runs `eslint js/`.
export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
]
