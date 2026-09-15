import type { User } from "firebase/auth";

import type {
  AuthAdapter,
  AuthCredentials,
  AuthSession,
} from "@mobile/features/auth/types";

export const testSession = {
  displayName: "Cliente de teste",
  email: "cliente@bytebank.test",
  uid: "test-user-id",
} as User;

export interface TestAuthAdapter extends AuthAdapter {
  emitSession(session: AuthSession | null): void;
  emitSessionError(error: unknown): void;
  login: jest.MockedFunction<(credentials: AuthCredentials) => Promise<void>>;
  logout: jest.MockedFunction<() => Promise<void>>;
}

export function createTestAuthAdapter(
  initialSession: AuthSession | null = null,
  options: { deferInitialSession?: boolean } = {},
): TestAuthAdapter {
  let onSessionChanged: (session: AuthSession | null) => void = () => undefined;
  let onError: (error: unknown) => void = () => undefined;

  const adapter: TestAuthAdapter = {
    emitSession(session) {
      onSessionChanged(session);
    },
    emitSessionError(error) {
      onError(error);
    },
    login: jest.fn<Promise<void>, [AuthCredentials]>(async () => undefined),
    logout: jest.fn<Promise<void>, []>(async () => undefined),
    observeSession(nextSessionChanged, nextError) {
      onSessionChanged = nextSessionChanged;
      onError = nextError;
      if (!options.deferInitialSession) {
        onSessionChanged(initialSession);
      }

      return () => undefined;
    },
  };

  return adapter;
}
