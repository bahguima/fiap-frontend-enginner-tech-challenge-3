"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  ANONYMOUS_SESSION,
  authApi,
  RestClientError,
} from "@banking/shared/api-client";
import { cachePolicies } from "@banking/shared/query";
import type {
  AuthContextValue,
  AuthProviderProps,
  AuthUser,
  LoginResult,
  SessionEndReason,
} from "./interface";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  sessionEndReason: null,
  login: async () => ({ status: "error" }),
  logout: async () => {},
});

export const authQueryKeys = {
  all: ["auth"] as const,
  session: () => [...authQueryKeys.all, "session"] as const,
};

/**
 * Fim da sessão (logout, inatividade ou refresh rejeitado): cancela o que
 * estiver em voo, remove todo dado de servidor do cache e marca a sessão como
 * anônima. A query de sessão é mantida (e não recriada) para que o
 * `useQuery` do provider continue observando-a.
 */
export function clearSessionCache(queryClient: QueryClient) {
  const isSessionQuery = (queryKey: readonly unknown[]) =>
    queryKey[0] === authQueryKeys.all[0];

  void queryClient.cancelQueries({
    predicate: (query) => !isSessionQuery(query.queryKey),
  });
  queryClient.removeQueries({
    predicate: (query) => !isSessionQuery(query.queryKey),
  });
  queryClient.getMutationCache().clear();
  queryClient.setQueryData(authQueryKeys.session(), ANONYMOUS_SESSION);
}

function toLoginResult(error: unknown): LoginResult {
  if (!(error instanceof RestClientError)) return { status: "error" };

  if (error.code === "ACCOUNT_LOCKED") {
    return {
      status: "locked",
      retryAfterSeconds: error.meta?.retryAfterSeconds ?? 0,
    };
  }

  if (error.code === "INVALID_CREDENTIALS") {
    return {
      status: "invalid-credentials",
      remainingAttempts: error.meta?.remainingAttempts ?? null,
    };
  }

  return { status: "error" };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [sessionEndReason, setSessionEndReason] =
    useState<SessionEndReason | null>(null);
  const sessionQuery = useQuery({
    queryKey: authQueryKeys.session(),
    queryFn: authApi.getSession,
    ...cachePolicies.session,
  });
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (session) => {
      // Descarta uma verificação de sessão em voo (ex.: a inicial, anônima),
      // que de outro modo sobrescreveria a sessão recém-criada.
      await queryClient.cancelQueries({ queryKey: authQueryKeys.session() });
      queryClient.setQueryData(authQueryKeys.session(), session);
    },
  });
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
  });

  // Qualquer fim de sessão (inclusive refresh rejeitado em uma requisição
  // de um remote) limpa o cache do QueryClient único.
  useEffect(
    () =>
      authApi.subscribe((event) => {
        if (event.type === "ended") {
          clearSessionCache(queryClient);
          setSessionEndReason(event.reason);
        }
        if (event.type === "established") setSessionEndReason(null);
      }),
    [queryClient],
  );

  const sessionUser = sessionQuery.data?.user;
  const user: AuthUser | null = sessionUser
    ? { name: sessionUser.name, email: sessionUser.email }
    : null;

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const session = await loginMutation.mutateAsync({ email, password });
      return session.authenticated
        ? { status: "authenticated" }
        : { status: "error" };
    } catch (error) {
      return toLoginResult(error);
    }
  };

  const logout: AuthContextValue["logout"] = async (reason = "logout") => {
    await logoutMutation.mutateAsync(reason);
    // Garante a limpeza mesmo sem sessão ativa no store (nenhum evento).
    clearSessionCache(queryClient);
    setSessionEndReason(reason);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: sessionQuery.isPending,
        sessionEndReason,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
