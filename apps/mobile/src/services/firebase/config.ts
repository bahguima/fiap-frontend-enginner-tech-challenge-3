import type { FirebaseOptions } from "firebase/app";
import { Platform } from "react-native";

export const FIREBASE_DEMO_PROJECT_ID = "demo-bytebank";

interface FirebaseRuntimeSelection {
  emulatorPreference?: string;
  nodeEnv?: string;
}

export function resolveUseFirebaseEmulators({
  emulatorPreference,
  nodeEnv,
}: FirebaseRuntimeSelection): boolean {
  const normalizedPreference = emulatorPreference?.trim().toLowerCase();

  if (!normalizedPreference) {
    return true;
  }

  if (normalizedPreference !== "true" && normalizedPreference !== "false") {
    throw new Error(
      "EXPO_PUBLIC_USE_FIREBASE_EMULATORS must be either true or false.",
    );
  }

  if (nodeEnv === "test" && normalizedPreference === "false") {
    throw new Error(
      "Firebase real is disabled in tests. Use the Firebase Emulator Suite.",
    );
  }

  return normalizedPreference === "true";
}

export const useFirebaseEmulators = resolveUseFirebaseEmulators({
  emulatorPreference: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS,
  nodeEnv: process.env.NODE_ENV,
});

const configuredOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim(),
};

const demoOptions: FirebaseOptions = {
  apiKey: "demo-bytebank-api-key",
  authDomain: `${FIREBASE_DEMO_PROJECT_ID}.firebaseapp.com`,
  projectId: FIREBASE_DEMO_PROJECT_ID,
  storageBucket: `${FIREBASE_DEMO_PROJECT_ID}.appspot.com`,
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demo-bytebank",
};

export function getFirebaseOptions(): FirebaseOptions {
  if (useFirebaseEmulators) {
    return demoOptions;
  }

  const missingOptions = Object.entries(configuredOptions)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingOptions.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missingOptions.join(", ")}.`,
    );
  }

  if (configuredOptions.projectId?.startsWith("demo-")) {
    throw new Error(
      "Firebase real requires a non-demo EXPO_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  return configuredOptions as FirebaseOptions;
}

export function getFirebaseEmulatorHost(): string {
  const configuredHost =
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST?.trim();

  if (configuredHost) {
    if (configuredHost.includes("://") || configuredHost.includes("/")) {
      throw new Error(
        "EXPO_PUBLIC_FIREBASE_EMULATOR_HOST must contain only a hostname or IP address.",
      );
    }

    return configuredHost;
  }

  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
}
