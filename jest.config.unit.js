/** Jest config — unit tests */
module.exports = {
  displayName: 'Unit Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/unit/**/*.test.ts'],
  // Domain module libraries (src/backend/domain-*) are v3 integration scope;
  // their standalone suites are excluded from the v2 app test gate.
  testPathIgnorePatterns: ['/node_modules/', 'src/backend/domain-'],
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utilities/$1',
    '^@middleware/(.*)$': '<rootDir>/src/shared/middleware/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/prototype/**',
    '!src/**/index.ts',
    '!src/frontend/**'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          skipLibCheck: true,
          resolveJsonModule: true
        }
      }
    ]
  }
};
