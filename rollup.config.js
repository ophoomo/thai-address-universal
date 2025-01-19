import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const formats = ['umd', 'esm', 'cjs'];
const outputDirs = {
    umd: 'dist/umd',
    esm: 'dist/esm',
    cjs: 'dist/cjs',
};

export default formats.map((format) => ({
    input: 'src/index.ts',
    output: {
        dir: outputDirs[format],
        format: format,
        name: format === 'umd' ? 'ThaiAddressUniversal' : undefined,
        sourcemap: true,
        inlineDynamicImports: format === 'umd' ? true : undefined,
    },
    plugins: [
        json(),
        resolve(),
        typescript({
            tsconfig: './tsconfig.json',
            outDir: outputDirs[format],
            declarationDir:
                format === 'esm' ? `${outputDirs[format]}/types` : null,
            declaration: format === 'esm' ? true : false,
        }),
        commonjs(),
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
        }),
        terser(),
    ],
    external: [],
}));
