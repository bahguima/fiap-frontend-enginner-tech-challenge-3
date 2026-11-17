import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  apiEndpoints,
  authApi,
  authSession,
  categoriesApi,
  dashboardApi,
  profileApi,
  transactionsApi,
  type AuthSessionEvent,
} from "@banking/shared/api-client";
import { AuthProvider, useAuth } from "@banking/shared/auth";
import { cachePolicies, createQueryClient } from "@banking/shared/query";
import type { ApiErrorResponse } from "@banking/shared/types";
import {
  clearMockRefreshCookie,
  expireMockAccessTokens,
  LOGIN_LOCK_SECONDS,
} from "../mocks/authState";
import { server } from "../mocks/server";
import { signOutTestSession } from "../testSession";

/** Registra as requisições que chegam ao MSW (método + caminho). */
function recordRequests() {
  const requests: string[] = [];
  const listener = ({ request }: { request: Request }) => {
    requests.push(`${request.method} ${new URL(request.url).pathname}`);
  };
  server.events.on("request:start", listener);
  return {
    requests,
    count: (entry: string) => requests.filter((item) => item === entry).length,
    stop: () => server.events.removeListener("request:start", listener),
  };
}

const absolute = (path: string) => new URL(path, "http://localhost").toString();

describe("autenticação segura: refresh, CSRF e bloqueio", () => {
  it("renova o token uma única vez para várias requisições simultâneas com 401", async () => {
    const recorder = recordRequests();
    const events: AuthSessionEvent["type"][] = [];
    const unsubscribe = authApi.subscribe((event) => events.push(event.type));
    const tokenBefore = authSession.getAccessToken();
    expireMockAccessTokens();

    const [summary, profile, categories] = await Promise.all([
      dashboardApi.getSummary(),
      profileApi.get(),
      categoriesApi.list(),
    ]);

    recorder.stop();
    unsubscribe();

    expect(summary.balance.formattedValue).toMatch(/^R\$/);
    expect(profile.name).toBe("Fulano");
    expect(categories.items.length).toBeGreaterThan(0);
    // Um único refresh, e cada requisição original repetida uma única vez.
    expect(recorder.count("POST /api/auth/refresh")).toBe(1);
    expect(recorder.count("GET /api/dashboard/summary")).toBe(2);
    expect(recorder.count("GET /api/profile")).toBe(2);
    expect(recorder.count("GET /api/categories")).toBe(2);
    expect(authSession.getAccessToken()).not.toBe(tokenBefore);
    expect(events).toEqual(["renewed"]);
  });

  it("envia Authorization: Bearer com o token em memória", async () => {
    const authorizations: (string | null)[] = [];
    const listener = ({ request }: { request: Request }) => {
      authorizations.push(request.headers.get("Authorization"));
    };
    server.events.on("request:start", listener);

    await profileApi.get();
    server.events.removeListener("request:start", listener);

    expect(authorizations).toEqual([`Bearer ${authSession.getAccessToken()}`]);
  });

  it("encerra a sessão e limpa o cache do Query quando o refresh falha", async () => {
    const queryClient = createQueryClient({ queries: { retry: false } });
    const Probe = () => {
      const { user, isLoading } = useAuth();
      if (isLoading) return <p>Carregando</p>;
      return <p>{user ? `Conectado como ${user.name}` : "Desconectado"}</p>;
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    render(<Probe />, { wrapper });
    expect(await screen.findByText("Conectado como Fulano")).toBeInTheDocument();

    await queryClient.fetchQuery({
      queryKey: ["dashboard", "summary"],
      queryFn: () => dashboardApi.getSummary(),
      ...cachePolicies.dashboard,
    });
    expect(queryClient.getQueryData(["dashboard", "summary"])).toBeDefined();

    const recorder = recordRequests();
    expireMockAccessTokens();
    clearMockRefreshCookie();

    await act(async () => {
      await expect(profileApi.get()).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHORIZED",
      });
    });
    recorder.stop();

    expect(await screen.findByText("Desconectado")).toBeInTheDocument();
    expect(recorder.count("POST /api/auth/refresh")).toBe(1);
    expect(recorder.count("GET /api/profile")).toBe(1);
    expect(authSession.hasAccessToken()).toBe(false);
    expect(queryClient.getQueryData(["dashboard", "summary"])).toBeUndefined();
    expect(queryClient.getQueryData(["auth", "session"])).toEqual({
      authenticated: false,
      user: null,
    });
    queryClient.clear();
  });

  it("restaura a sessão pelo cookie HttpOnly simulado após recarregar", async () => {
    // Recarregar descarta a memória do cliente; o cookie continua no "navegador".
    authSession.reset();

    await expect(authApi.getSession()).resolves.toMatchObject({
      authenticated: true,
      user: { name: "Fulano" },
    });
    expect(authSession.hasAccessToken()).toBe(true);
  });

  it("rejeita alterações de estado sem X-CSRF-Token válido", async () => {
    const authorization = `Bearer ${authSession.getAccessToken()}`;
    const body = JSON.stringify({
      description: "Tentativa CSRF",
      amount: 10,
      type: "expense",
      category: "Pagamento",
      date: "2026-07-01",
      status: "completed",
    });
    const send = (headers: Record<string, string>) =>
      fetch(absolute(apiEndpoints.transactions.list), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authorization, ...headers },
        body,
      });

    const withoutToken = await send({});
    const withWrongToken = await send({ "X-CSRF-Token": "forjado" });
    const loginWithoutToken = await fetch(absolute(apiEndpoints.auth.login), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "email@teste.com", password: "123" }),
    });

    for (const response of [withoutToken, withWrongToken, loginWithoutToken]) {
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject<ApiErrorResponse>({
        error: { code: "CSRF_TOKEN_INVALID", message: expect.any(String) },
      });
    }

    // O cliente envia o header em todo método que altera estado.
    const csrfHeaders: (string | null)[] = [];
    const listener = ({ request }: { request: Request }) => {
      if (request.method !== "GET") csrfHeaders.push(request.headers.get("X-CSRF-Token"));
    };
    server.events.on("request:start", listener);
    const created = await transactionsApi.create(JSON.parse(body));
    await transactionsApi.remove(created.id);
    server.events.removeListener("request:start", listener);

    expect(csrfHeaders).toHaveLength(2);
    expect(csrfHeaders.every((value) => value === authSession.getCsrfToken())).toBe(true);
  });

  it("obtém o token anti-CSRF antes do login anônimo", async () => {
    signOutTestSession();
    const recorder = recordRequests();

    await authApi.login({ email: "email@teste.com", password: "123" });
    recorder.stop();

    expect(recorder.requests).toEqual(["GET /api/auth/csrf", "POST /api/auth/login"]);
  });

  it("bloqueia o login após 5 tentativas inválidas, mesmo com a senha correta", async () => {
    signOutTestSession();
    const attempt = (password: string) =>
      authApi.login({ email: "email@teste.com", password }).catch((error) => error);

    const failures = [];
    for (let index = 0; index < 4; index += 1) {
      failures.push(await attempt("errada"));
    }

    expect(failures.map((error) => error.meta?.remainingAttempts)).toEqual([4, 3, 2, 1]);
    expect(failures.every((error) => error.code === "INVALID_CREDENTIALS")).toBe(true);

    await expect(attempt("errada")).resolves.toMatchObject({
      status: 429,
      code: "ACCOUNT_LOCKED",
      meta: { retryAfterSeconds: LOGIN_LOCK_SECONDS },
    });
    await expect(attempt("123")).resolves.toMatchObject({
      status: 429,
      code: "ACCOUNT_LOCKED",
    });
    expect(authSession.hasAccessToken()).toBe(false);
  });

  it("revoga a sessão no logout: o cookie de refresh deixa de valer", async () => {
    await authApi.logout();

    expect(authSession.hasAccessToken()).toBe(false);
    await expect(authApi.getSession()).resolves.toEqual({
      authenticated: false,
      user: null,
    });
  });
});
