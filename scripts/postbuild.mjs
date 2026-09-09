/**
 * Post-build fixups applied to the Rolldown + `tsc` output.
 *
 * 1. Declaration extensions — `tsc` emits `.d.ts` with extension-less relative
 *    imports (e.g. `from '../types/thai-address'`). That is fine for the
 *    `classic` / `node` / `bundler` module-resolution modes, but TypeScript's
 *    `node16` / `nodenext` resolution rejects it (TS2834). Every relative
 *    specifier in the emitted declarations is rewritten to carry an explicit
 *    `.js` extension.
 *
 * 2. CJS type resolution — the package is `"type": "module"`, so a single
 *    `types` entry pointing at the ESM declarations makes `node16` resolution
 *    from a CommonJS consumer see the types as ESM ("masquerading as ESM").
 *    The ESM declaration tree is copied to `dist/cjs/types/` with a
 *    `{"type":"commonjs"}` marker so the `require` condition can point there.
 *
 * 3. Module-format marker — `dist/cjs/package.json` pins the runtime folder to
 *    CommonJS so Node does not parse `dist/cjs/index.js` as ESM.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const ESM_TYPES = join(DIST, 'esm', 'types');
const CJS_TYPES = join(DIST, 'cjs', 'types');

// `from '...'`, `import('...')` and bare `import '...'` with a relative path.
const SPECIFIER =
    /(\bfrom\s+|import\s*\(\s*|\bimport\s+)(['"])(\.\.?\/[^'"]+)\2/g;

async function* walkDeclarations(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) yield* walkDeclarations(full);
        else if (entry.name.endsWith('.d.ts')) yield full;
    }
}

// ── 1. Add `.js` extensions to relative imports in the ESM declarations ──────
let patched = 0;
for await (const file of walkDeclarations(ESM_TYPES)) {
    const src = await readFile(file, 'utf8');
    const out = src.replace(SPECIFIER, (match, keyword, quote, spec) =>
        extname(spec) ? match : `${keyword}${quote}${spec}.js${quote}`,
    );
    if (out !== src) {
        await writeFile(file, out);
        patched++;
    }
}
console.log(`postbuild: patched ${patched} declaration file(s)`);

// ── 2. Mirror the declarations for the CommonJS `require` condition ─────────
// Copy just the `.d.ts` (no maps — they would point at unpublished sources),
// dropping the sourceMappingURL comment, plus a CommonJS marker so `node16`
// resolution from a CJS consumer reads these as CJS types.
let mirrored = 0;
for await (const file of walkDeclarations(ESM_TYPES)) {
    const target = join(CJS_TYPES, file.slice(ESM_TYPES.length + 1));
    const body = (await readFile(file, 'utf8')).replace(
        /\n?\/\/# sourceMappingURL=.*$/m,
        '',
    );
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
    mirrored++;
}
await writeFile(
    join(CJS_TYPES, 'package.json'),
    `${JSON.stringify({ type: 'commonjs' }, null, 4)}\n`,
);
console.log(
    `postbuild: mirrored ${mirrored} declaration file(s) to dist/cjs/types`,
);

// ── 3. Pin the CJS + UMD runtime folders to CommonJS ───────────────────────
// The root package is `"type": "module"`, so without this Node would parse the
// `.js` files in these folders as ESM. The UMD build then also loads correctly
// through `require()`, not just a browser `<script>`.
const commonjsMarker = `${JSON.stringify({ type: 'commonjs' }, null, 4)}\n`;
for (const folder of ['cjs', 'umd']) {
    await mkdir(join(DIST, folder), { recursive: true });
    await writeFile(join(DIST, folder, 'package.json'), commonjsMarker);
}
console.log('postbuild: wrote dist/{cjs,umd}/package.json');
