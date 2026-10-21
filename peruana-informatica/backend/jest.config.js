module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.interface.ts',
        '!src/server.ts',
        '!src/database/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        './src/utils/': {
            statements: 85,
            branches: 75,
            functions: 55,
            lines: 85,
        },
        './src/middleware/': {
            statements: 30,
            branches: 35,
            functions: 30,
            lines: 30,
        },
    },
    testTimeout: 10000,
    verbose: true,
};
