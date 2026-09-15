import "firebase/auth";
import type { Persistence } from "firebase/auth";

interface ReactNativeAsyncStorage {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
}

declare module "firebase/auth" {
  // Firebase exposes this API at runtime through its React Native entrypoint,
  // but the firebase/auth wrapper currently publishes only the web declaration.
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
