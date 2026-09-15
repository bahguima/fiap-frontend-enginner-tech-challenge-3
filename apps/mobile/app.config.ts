import type { ExpoConfig } from "expo/config";

const firebaseEmulatorPreference =
  process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS?.trim().toLowerCase();

if (
  firebaseEmulatorPreference &&
  firebaseEmulatorPreference !== "true" &&
  firebaseEmulatorPreference !== "false"
) {
  throw new Error(
    "EXPO_PUBLIC_USE_FIREBASE_EMULATORS must be either true or false.",
  );
}

if (firebaseEmulatorPreference === "false") {
  const requiredFirebaseVariables = {
    EXPO_PUBLIC_FIREBASE_API_KEY:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const missingFirebaseVariables = Object.entries(requiredFirebaseVariables)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missingFirebaseVariables.length > 0) {
    throw new Error(
      `Firebase real requires: ${missingFirebaseVariables.join(", ")}.`,
    );
  }

  if (requiredFirebaseVariables.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.startsWith("demo-")) {
    throw new Error(
      "Firebase real requires a non-demo EXPO_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }
}

const config: ExpoConfig = {
  name: "ByteBank",
  slug: "bytebank-mobile",
  version: "0.1.0",
  icon: "./assets/icon.png",
  orientation: "portrait",
  scheme: "bytebank",
  userInterfaceStyle: "automatic",
  backgroundColor: "#fcfcfc",
  platforms: ["ios", "android", "web"],
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#fcfcfc",
        image: "./assets/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        dark: {
          backgroundColor: "#0a0e15",
          image: "./assets/splash-icon.png",
        },
      },
    ],
  ],
  experiments: {
    autolinkingModuleResolution: true,
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: "com.bytebank.mobile",
    buildNumber: "1",
    icon: "./assets/icon.png",
    supportsTablet: true,
  },
  android: {
    package: "com.bytebank.mobile",
    versionCode: 1,
    permissions: [],
    adaptiveIcon: {
      backgroundColor: "#fcfcfc",
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon.png",
    },
  },
  web: {
    bundler: "metro",
  },
};

export default config;
