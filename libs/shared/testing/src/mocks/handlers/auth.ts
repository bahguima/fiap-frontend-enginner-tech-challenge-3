import { http, HttpResponse } from "msw";
import type {
  ApiErrorResponse,
  ApiMessageResponse,
  AuthSession,
  CsrfTokenResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from "@banking/shared/types";
import { mockApiEndpoints } from "@banking/shared/api-client/endpoints";
import { mockAuthCredentials, mockAuthUser } from "../fixtures/auth";
import {
  clearMockFailedLogins,
  createMockSession,
  getMockLoginLock,
  issueMockCsrfToken,
  registerMockFailedLogin,
  resolveMockAccessToken,
  revokeMockSession,
  rotateMockSession,
} from "../authState";
import { applyMockBehavior, createErrorResponse } from "./behavior";
import { requireAccessToken, requireCsrfToken } from "./security";

const lockedResponse = (retryAfterSeconds: number) =>
  createErrorResponse(
    429,
    "ACCOUNT_LOCKED",
    "Muitas tentativas inválidas. O acesso foi bloqueado temporariamente.",
    undefined,
    {
      meta: { retryAfterSeconds },
      headers: { "Retry-After": `${retryAfterSeconds}` },
    },
  );

/**
 * Contrato de autenticação:
 *
 * - `GET  /api/auth/csrf`    → `{ csrfToken }` e cookie `bb_csrf` (double-submit).
 * - `POST /api/auth/login`   → concessão (access token de 5 min em memória) e
 *   cookie `bb_refresh` `HttpOnly`. 5 falhas seguidas bloqueiam por 15 min (429).
 * - `POST /api/auth/refresh` → rotaciona o refresh token e emite novo access token.
 * - `GET  /api/auth/session` → sessão do Bearer (401 sem token válido).
 * - `POST /api/auth/logout`  → revoga a sessão e limpa os cookies.
 *
 * Todo POST exige `X-CSRF-Token`.
 */
export const authHandlers = [
  http.get<never, never, CsrfTokenResponse | ApiErrorResponse>(
    mockApiEndpoints.auth.csrf,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;

      return HttpResponse.json<CsrfTokenResponse>({
        csrfToken: issueMockCsrfToken(),
      });
    },
  ),
  http.post<never, LoginRequest, LoginResponse | ApiErrorResponse>(
    mockApiEndpoints.auth.login,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;
      const csrfError = requireCsrfToken(request);
      if (csrfError) return csrfError;

      const credentials = await request.json();
      const lockedFor = getMockLoginLock(credentials.email);
      if (lockedFor !== null) return lockedResponse(lockedFor);

      if (
        credentials.email !== mockAuthCredentials.email ||
        credentials.password !== mockAuthCredentials.password
      ) {
        const outcome = registerMockFailedLogin(credentials.email);
        if (outcome.locked) return lockedResponse(outcome.retryAfterSeconds);

        return createErrorResponse(
          401,
          "INVALID_CREDENTIALS",
          "E-mail ou senha inválidos.",
          undefined,
          { meta: { remainingAttempts: outcome.remainingAttempts } },
        );
      }

      clearMockFailedLogins(credentials.email);
      return HttpResponse.json<LoginResponse>(createMockSession(mockAuthUser));
    },
  ),
  http.post<never, never, RefreshResponse | ApiErrorResponse>(
    mockApiEndpoints.auth.refresh,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;
      const csrfError = requireCsrfToken(request);
      if (csrfError) return csrfError;

      const grant = rotateMockSession();
      if (!grant) {
        return createErrorResponse(
          401,
          "UNAUTHORIZED",
          "Sessão expirada. Entre novamente.",
        );
      }

      return HttpResponse.json<RefreshResponse>(grant);
    },
  ),
  http.get<never, never, AuthSession | ApiErrorResponse>(
    mockApiEndpoints.auth.session,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;
      const authError = requireAccessToken(request);
      if (authError) return authError;

      const session = resolveMockAccessToken(request.headers.get("Authorization"));
      return HttpResponse.json<AuthSession>({
        authenticated: true,
        user: session?.user ?? null,
      });
    },
  ),
  http.post<never, never, ApiMessageResponse | ApiErrorResponse>(
    mockApiEndpoints.auth.logout,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;
      const csrfError = requireCsrfToken(request);
      if (csrfError) return csrfError;

      revokeMockSession(request.headers.get("Authorization"));
      return HttpResponse.json<ApiMessageResponse>({
        message: "Sessão encerrada com sucesso.",
      });
    },
  ),
];
