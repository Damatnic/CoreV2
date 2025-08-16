/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  setupFiles: ['<rootDir>/jest-env-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo-auth-session|expo-constants|@expo|react-markdown|remark-gfm)/)'
  ],
  moduleNameMapper: {
    '^workbox-(.*)$': '<rootDir>/tests/__mocks__/workbox-$1.js',
    '\\.css$': 'identity-obj-proxy',
    '\\.module\\.css$': 'identity-obj-proxy',
    '^../contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx',
    '^./contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx'
  },
  testMatch: [
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/test-utils.tsx'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage',
  verbose: true,
  // Service Worker specific configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  testTimeout: 10000
};
