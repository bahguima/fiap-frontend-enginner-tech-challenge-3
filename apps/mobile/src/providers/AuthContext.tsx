import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { firebaseAuthAdapter } from "@mobile/features/auth/data/firebaseAuthAdapter";
import type {
  AuthAdapter,
  AuthContextValue,
  AuthCredentials,
  AuthSession,
} from "@mobile/features/auth/types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps extends PropsWithChildren {
  adapter?: AuthAdapter;
}

export function AuthProvider({
  adapter = firebaseAuthAdapter,
  children,
}: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setIsInitializing(true);

    return adapter.observeSession(
      (nextSession) => {
        setSession(nextSession);
        setIsInitializing(false);
      },
      () => {
        setSession(null);
        setIsInitializing(false);
      },
    );
  }, [adapter]);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      await adapter.login(credentials);
    },
    [adapter],
  );

  const logout = useCallback(async () => {
    await adapter.logout();
  }, [adapter]);

  const value = useMemo<AuthContextValue>(
    () => ({ isInitializing, login, logout, session }),
    [isInitializing, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
