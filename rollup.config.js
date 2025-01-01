import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/thai-address-universal.cjs.js',
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: 'dist/thai-address-universal.esm.js',
            format: 'esm',
            sourcemap: true,
        },
        {
            file: 'dist/thai-address-universal.umd.js',
            format: 'umd',
            name: 'ThaiAddressUniversal',
            sourcemap: true,
        },
    ],
    plugins: [
        json(),
        resolve(),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        terser(),
        babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
        }),
    ],
    external: [
        'vue',
        'react',
        'react-dom',
        '@angular/core',
        '@angular/common',
        '@angular/compiler',
    ],
};
