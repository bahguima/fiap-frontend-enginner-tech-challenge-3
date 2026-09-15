jest.mock("@react-native-async-storage/async-storage", () =>
  // Jest requires this mock factory to load the package's CommonJS test double.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
