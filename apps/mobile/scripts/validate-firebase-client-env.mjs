const requiredVariables = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS !== "false") {
  throw new Error(
    "Real export requires EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false.",
  );
}

const missingVariables = requiredVariables.filter(
  (variableName) => !process.env[variableName]?.trim(),
);

if (missingVariables.length > 0) {
  throw new Error(
    `Real export is missing Firebase client configuration: ${missingVariables.join(", ")}.`,
  );
}

if (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.startsWith("demo-")) {
  throw new Error(
    "Real export requires a non-demo EXPO_PUBLIC_FIREBASE_PROJECT_ID.",
  );
}

console.log("Firebase client environment is complete for a real export.");
