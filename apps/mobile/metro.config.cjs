const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNxMetro } = require("@nx/expo");
const { withNativeWind } = require("nativewind/metro");

const config = withNxMetro(getDefaultConfig(__dirname), {
  extensions: [],
  watchFolders: [],
});

config.resolver.nodeModulesPaths = [
  path.join(__dirname, "node_modules"),
  path.join(__dirname, "../../node_modules"),
];
config.resolver.extraNodeModules = {
  react: path.join(__dirname, "node_modules/react"),
  "react-native": path.join(__dirname, "node_modules/react-native"),
  "react-native-css-interop": path.join(
    __dirname,
    "node_modules/react-native-css-interop",
  ),
  "react-native-reanimated": path.join(
    __dirname,
    "node_modules/react-native-reanimated",
  ),
  "react-native-worklets": path.join(
    __dirname,
    "node_modules/react-native-worklets",
  ),
};

module.exports = withNativeWind(config, { input: "./global.css" });
