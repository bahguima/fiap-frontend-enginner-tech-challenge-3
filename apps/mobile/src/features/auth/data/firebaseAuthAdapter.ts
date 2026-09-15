import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { getFirebaseServices } from "@mobile/services/firebase";
import type { AuthAdapter } from "@mobile/features/auth/types";

export const firebaseAuthAdapter: AuthAdapter = {
  observeSession(onSessionChanged, onError) {
    const { auth } = getFirebaseServices();

    return onAuthStateChanged(auth, onSessionChanged, onError);
  },

  async login({ email, password }) {
    const { auth } = getFirebaseServices();

    await signInWithEmailAndPassword(auth, email.trim(), password);
  },

  async logout() {
    const { auth } = getFirebaseServices();

    await signOut(auth);
  },
};
