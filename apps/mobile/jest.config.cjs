process.env.EXPO_OS ??= "android";

const expoPreset = require("jest-expo/jest-preset");

module.exports = {
  ...expoPreset,
  transform: {
    ...expoPreset.transform,
    "^.+\\.mjs$": "babel-jest",
  },
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  testPathIgnorePatterns: ["\\.emulator\\.test\\.[jt]sx?$"],
  setupFiles: [
    "<rootDir>/src/test/environment.cjs",
    ...expoPreset.setupFiles,
  ],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|react-native-css-interop|@react-native(-community)?|expo|expo-.*|@expo(nent)?/.*|@expo-google-fonts/.*|firebase|@firebase/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)/)",
  ],
  moduleNameMapper: {
    ...expoPreset.moduleNameMapper,
    "^react$": "<rootDir>/node_modules/react",
    "^react/(.*)$": "<rootDir>/node_modules/react/$1",
    "^lucide-react-native$": "<rootDir>/src/test/lucide.tsx",
    "^react-native-css-interop$":
      "<rootDir>/node_modules/react-native-css-interop/dist/index.js",
    "^@mobile/(.*)$": "<rootDir>/src/$1",
    "^@banking/shared/design-tokens$":
      "<rootDir>/../../libs/shared/design-tokens/src/index.ts",
    "^@banking/shared/domain$":
      "<rootDir>/../../libs/shared/domain/src/index.ts",
    "^@banking/shared/types$":
      "<rootDir>/../../libs/shared/types/src/index.ts",
    "^@banking/shared/validation$":
      "<rootDir>/../../libs/shared/validation/src/index.ts",
  },
};
