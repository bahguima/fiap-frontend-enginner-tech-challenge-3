import type { ReactNode } from "react";

export interface AuthProviderProps {
  children: ReactNode;
}

export interface AuthUser {
  name: string;
  email: string;
}

/** Motivo do fim da sessão, para mensagens na interface. */
export type SessionEndReason = "logout" | "expired" | "idle";

/**
 * Resultado do login para a interface. Não carrega tokens nem dados do
 * servidor além do necessário para a mensagem acessível.
 */
export type LoginResult =
  | { status: "authenticated" }
  | { status: "invalid-credentials"; remainingAttempts: number | null }
  | { status: "locked"; retryAfterSeconds: number }
  | { status: "error" };

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /**
   * Motivo do último fim de sessão (ex.: `idle`), para a tela de login
   * explicar por que o usuário saiu. Volta a `null` no próximo login.
   */
  sessionEndReason: SessionEndReason | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: (reason?: SessionEndReason) => Promise<void>;
}
