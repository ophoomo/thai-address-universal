import { defineConfig } from 'rolldown';

/**
 * Rolldown replaces the previous Rollup + Babel + Terser + typescript-plugin
 * stack. Rolldown transpiles TypeScript (via oxc) and minifies natively, so
 * the whole toolchain collapses to this file plus a `tsc` pass for the
 * declaration files (see `tsconfig.build.json`).
 *
 * Three targets are emitted:
 *   - `dist/esm` — ES modules, dynamic `import()` kept as separate chunks so
 *     the ~275 KB of address data is only fetched when a lookup runs.
 *   - `dist/cjs` — CommonJS with the same code-split chunks.
 *   - `dist/umd` — a single self-contained file for `<script>` usage.
 */
const shared = {
    input: 'src/index.ts',
    // `neutral` keeps the bundle free of Node- or browser-specific shims; the
    // library feature-detects `window` / `process` itself.
    platform: 'neutral',
};

const sourcemap = true;
const minify = true;

export default defineConfig([
    {
        ...shared,
        output: { dir: 'dist/esm', format: 'es', sourcemap, minify },
    },
    {
        ...shared,
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            exports: 'named',
            sourcemap,
            minify,
        },
    },
    {
        ...shared,
        output: {
            dir: 'dist/umd',
            format: 'umd',
            name: 'ThaiAddressUniversal',
            // One file for CDN consumers: fold the lazy data chunks back in.
            codeSplitting: false,
            sourcemap,
            minify,
        },
    },
]);
