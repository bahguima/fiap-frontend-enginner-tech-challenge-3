import type {
  ApiMessageResponse,
  AuthSession,
  LoginRequest,
  LoginResponse,
} from "@banking/shared/types";
import { restClient, RestClientError } from "./client";
import { apiEndpoints } from "./endpoints";
import {
  authSession,
  type AuthSessionListener,
  type SessionEndReason,
} from "./session";

export const ANONYMOUS_SESSION: AuthSession = {
  authenticated: false,
  user: null,
};

/**
 * Fachada de autenticação. Tokens nunca saem desta camada: `login` aplica a
 * concessão no store em memória e devolve apenas a `AuthSession`, então o
 * access token não chega ao React nem ao cache do TanStack Query.
 */
export interface AuthApi {
  login: (credentials: LoginRequest) => Promise<AuthSession>;
  /**
   * Sessão atual. Sem access token em memória (ex.: após recarregar), tenta
   * restaurá-la pelo refresh token do cookie `HttpOnly`; sem cookie válido,
   * devolve a sessão anônima.
   */
  getSession: () => Promise<AuthSession>;
  /** Revoga a sessão no servidor (best-effort) e descarta as credenciais. */
  logout: (reason?: SessionEndReason) => Promise<void>;
  subscribe: (listener: AuthSessionListener) => () => void;
}

export const authApi: AuthApi = {
  login: async (credentials) => {
    const grant = await restClient.request<LoginResponse, LoginRequest>(
      apiEndpoints.auth.login,
      {
        method: "POST",
        body: credentials,
        skipAuthRefresh: true,
      },
    );

    authSession.applyGrant(grant, "login");
    return grant.session;
  },
  getSession: async () => {
    if (!authSession.hasAccessToken()) {
      const restored = await restClient.refreshSession();
      if (!restored) return ANONYMOUS_SESSION;
    }

    try {
      return await restClient.request<AuthSession>(apiEndpoints.auth.session);
    } catch (error) {
      if (error instanceof RestClientError && error.status === 401) {
        return ANONYMOUS_SESSION;
      }
      throw error;
    }
  },
  logout: async (reason = "logout") => {
    try {
      await restClient.request<ApiMessageResponse>(apiEndpoints.auth.logout, {
        method: "POST",
        skipAuthRefresh: true,
      });
    } catch {
      // A revogação no servidor é best-effort: localmente a sessão termina.
    } finally {
      authSession.end(reason);
    }
  },
  subscribe: (listener) => authSession.subscribe(listener),
};
