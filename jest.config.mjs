import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./apps/banking",
});

const customJestConfig = {
  moduleNameMapper: {
    "^@banking/shared/api-client$":
      "<rootDir>/libs/shared/api-client/src/index.ts",
    "^@banking/shared/api-client/(.*)$":
      "<rootDir>/libs/shared/api-client/src/$1",
    "^@banking/shared/auth$":
      "<rootDir>/libs/shared/auth/src/index.ts",
    "^@banking/shared/design-tokens$":
      "<rootDir>/libs/shared/design-tokens/src/index.ts",
    "^@banking/shared/domain$":
      "<rootDir>/libs/shared/domain/src/index.ts",
    "^@banking/shared/query$":
      "<rootDir>/libs/shared/query/src/index.ts",
    "^@banking/shared/testing/(.*)$":
      "<rootDir>/libs/shared/testing/src/$1",
    "^@banking/shared/types$":
      "<rootDir>/libs/shared/types/src/index.ts",
    "^@banking/shared/types/(.*)$":
      "<rootDir>/libs/shared/types/src/$1",
    "^@banking/shared/validation$":
      "<rootDir>/libs/shared/validation/src/index.ts",
    "^@banking/shared/ui$": "<rootDir>/libs/shared/ui/src/index.ts",
    "^@banking/shared/ui/(.*)$":
      "<rootDir>/libs/shared/ui/src/$1",
    "^@dashboard/(.*)$": "<rootDir>/apps/dashboard/src/$1",
    "^@institutional/(.*)$": "<rootDir>/apps/institutional/src/$1",
    "^@/(.*)$": "<rootDir>/apps/banking/src/$1",
  },
  setupFiles: [
    "<rootDir>/libs/shared/testing/src/setup/polyfills.ts",
    "<rootDir>/libs/shared/testing/src/setup/fetch-polyfills.ts",
  ],
  setupFilesAfterEnv: [
    "<rootDir>/libs/shared/testing/src/setup/setup.ts",
  ],
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    customExportConditions: [],
  },
  testMatch: [
    "<rootDir>/apps/**/*.{test,spec}.{ts,tsx}",
    "<rootDir>/libs/**/*.{test,spec}.{ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/apps/banking/.next/",
    "<rootDir>/apps/mobile/",
    "<rootDir>/apps/shell-e2e/",
    "<rootDir>/node_modules/",
  ],
};

export default createJestConfig(customJestConfig);
