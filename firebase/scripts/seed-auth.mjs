import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

const projectId = "demo-bytebank";
const host = process.env.FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
const email = "demo@bytebank.test";
const password = "ByteBank123!";

const app = initializeApp({
  apiKey: "demo-bytebank-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  appId: "1:000000000000:web:demo-bytebank-auth-seed",
});
const auth = getAuth(app);

connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });

try {
  let credential;

  try {
    credential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "auth/email-already-in-use"
    ) {
      throw error;
    }

    credential = await signInWithEmailAndPassword(auth, email, password);
  }

  console.info(
    `Seeded ${projectId} Auth with ${email} (uid: ${credential.user.uid}).`,
  );
} finally {
  await deleteApp(app);
}
