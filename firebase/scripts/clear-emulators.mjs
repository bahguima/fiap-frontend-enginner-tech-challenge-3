import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

const projectId = "demo-bytebank";
const host = process.env.FIREBASE_EMULATOR_HOST ?? "127.0.0.1";

if (!projectId.startsWith("demo-")) {
  throw new Error("Refusing to clear a non-demo Firebase project.");
}

const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: { host, port: 8080 },
  storage: { host, port: 9199 },
});

try {
  await Promise.all([
    testEnvironment.clearFirestore(),
    testEnvironment.clearStorage(),
  ]);

  const authResponse = await fetch(
    `http://${host}:9099/emulator/v1/projects/${projectId}/accounts`,
    { method: "DELETE" },
  );

  if (!authResponse.ok) {
    throw new Error(
      `Authentication Emulator returned HTTP ${authResponse.status}.`,
    );
  }

  console.info(`Cleared Auth, Firestore and Storage for ${projectId}.`);
} finally {
  await testEnvironment.cleanup();
}
