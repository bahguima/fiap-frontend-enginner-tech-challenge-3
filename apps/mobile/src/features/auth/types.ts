import type { User } from "firebase/auth";

export type AuthSession = User;

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthAdapter {
  observeSession(
    onSessionChanged: (session: AuthSession | null) => void,
    onError: (error: unknown) => void,
  ): () => void;
  login(credentials: AuthCredentials): Promise<void>;
  logout(): Promise<void>;
}

export interface AuthContextValue {
  session: AuthSession | null;
  isInitializing: boolean;
  login(credentials: AuthCredentials): Promise<void>;
  logout(): Promise<void>;
}
