const baseConfig = require("./jest.config.cjs");

module.exports = {
  ...baseConfig,
  testMatch: ["<rootDir>/src/**/*.emulator.test.{ts,tsx}"],
  testPathIgnorePatterns: [],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
};
