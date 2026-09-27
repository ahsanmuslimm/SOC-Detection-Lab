module.exports = {
  displayName: 'Integration Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utilities/$1',
    '^@middleware/(.*)$': '<rootDir>/src/shared/middleware/$1'
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
