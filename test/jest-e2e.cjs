const config = require('../jest.config.cjs');

module.exports = {
  ...config,
  rootDir: '..',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  testTimeout: 30000,
};
