import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['src/**/*.{ts}', 'test/**/*.{ts}'] },
    { ignores: ['dist/**/*', 'docs/**/*', 'coverage/**/*'] },
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];
