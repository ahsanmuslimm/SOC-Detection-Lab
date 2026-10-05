/** Jest config — integration tests
 *
 * maxWorkers: 1 is intentional: every integration file boots the gateway
 * on TCP port 3001, so files must run serially to avoid EADDRINUSE.
 */
module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', 'src/backend/domain-'],
  maxWorkers: 1,
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utilities/$1',
    '^@middleware/(.*)$': '<rootDir>/src/shared/middleware/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  testTimeout: 30000,
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
