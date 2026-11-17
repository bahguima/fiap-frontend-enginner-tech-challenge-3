import { isValidMockCsrfToken, resolveMockAccessToken } from "../authState";
import { createErrorResponse } from "./behavior";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Rejeita POST/PUT/PATCH/DELETE sem `X-CSRF-Token` igual ao cookie `bb_csrf`. */
export function requireCsrfToken(request: Request) {
  if (!STATE_CHANGING_METHODS.has(request.method)) return null;
  if (isValidMockCsrfToken(request.headers.get("X-CSRF-Token"))) return null;

  return createErrorResponse(
    403,
    "CSRF_TOKEN_INVALID",
    "Token anti-CSRF ausente ou inválido.",
  );
}

/** Exige `Authorization: Bearer` com access token válido e não expirado. */
export function requireAccessToken(request: Request) {
  if (resolveMockAccessToken(request.headers.get("Authorization"))) return null;

  return createErrorResponse(
    401,
    "UNAUTHORIZED",
    "Sessão expirada ou inexistente.",
    undefined,
    { headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' } },
  );
}

/** Recursos protegidos: CSRF (quando altera estado) e depois o Bearer. */
export function guardProtectedRequest(request: Request) {
  return requireCsrfToken(request) ?? requireAccessToken(request);
}
