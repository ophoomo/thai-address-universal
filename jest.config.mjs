/**
 * Jest transpiles the TypeScript sources with `@swc/jest` (Rust-based, and
 * independent of the installed `typescript` version, which matters now that
 * the project is on TypeScript 7). The compiler settings below mirror
 * `tsconfig.json`.
 */
export default {
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.js'],
    transform: {
        '^.+\\.[cm]?ts$': [
            '@swc/jest',
            {
                jsc: {
                    parser: { syntax: 'typescript' },
                    target: 'es2021',
                },
            },
        ],
    },
};
