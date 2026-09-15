import {
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import { connectAuthEmulator, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

import {
  getFirebaseOptions,
  getFirebaseEmulatorHost,
  useFirebaseEmulators,
} from "./config";
import { initializeFirebaseAuth } from "./initializeAuth";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}

interface FirebaseRuntimeRegistry {
  services?: FirebaseServices;
  emulatorConnections: Set<string>;
}

type FirebaseGlobal = typeof globalThis & {
  __bytebankFirebaseRegistry?: FirebaseRuntimeRegistry;
};

const firebaseGlobal = globalThis as FirebaseGlobal;
const firebaseAppName = "bytebank-mobile";
const registry = (firebaseGlobal.__bytebankFirebaseRegistry ??= {
  emulatorConnections: new Set<string>(),
});

function getOrInitializeApp(): FirebaseApp {
  const existingApp = getApps().find((app) => app.name === firebaseAppName);

  return existingApp ?? initializeApp(getFirebaseOptions(), firebaseAppName);
}

function connectOnce(key: string, connect: () => void): void {
  if (registry.emulatorConnections.has(key)) {
    return;
  }

  connect();
  registry.emulatorConnections.add(key);
}

function connectToEmulators(services: FirebaseServices): void {
  const host = getFirebaseEmulatorHost();
  const appKey = services.app.name;

  connectOnce(`auth:${appKey}`, () => {
    connectAuthEmulator(services.auth, `http://${host}:9099`, {
      disableWarnings: true,
    });
  });
  connectOnce(`firestore:${appKey}`, () => {
    connectFirestoreEmulator(services.firestore, host, 8080);
  });
  connectOnce(`storage:${appKey}`, () => {
    connectStorageEmulator(services.storage, host, 9199);
  });
}

export function getFirebaseServices(): FirebaseServices {
  if (registry.services) {
    return registry.services;
  }

  const app = getOrInitializeApp();
  const services: FirebaseServices = {
    app,
    auth: initializeFirebaseAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };

  if (useFirebaseEmulators) {
    connectToEmulators(services);
  }

  registry.services = services;
  return services;
}

export {
  FIREBASE_DEMO_PROJECT_ID,
  getFirebaseEmulatorHost,
  useFirebaseEmulators,
} from "./config";
