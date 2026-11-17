import type { AuthTokenResponse, AuthUser } from "@banking/shared/types";

/** Vida padrão do access token (5 min). */
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 5 * 60;

/**
 * Vida do access token emitido por login/refresh. Configurável por
 * `NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS` (ex.: 30 para demonstrar a
 * renovação silenciosa); valores que não sejam inteiros positivos caem no
 * padrão. Lido a cada concessão.
 */
export function resolveAccessTokenTtlSeconds(
  configured: string | undefined = process.env.NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS,
) {
  const value = configured?.trim() ?? "";
  if (!/^\d+$/.test(value)) return DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  const seconds = parseInt(value, 10);
  return seconds > 0 ? seconds : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
}

/** Tentativas inválidas consecutivas antes do bloqueio. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
/** Duração do bloqueio de login (15 min). */
export const LOGIN_LOCK_SECONDS = 15 * 60;

/**
 * Nomes e atributos dos cookies que a API real emite. O mock não envia
 * `Set-Cookie` de verdade: o MSW persistiria o cookie mockado em
 * `localStorage` (`__msw-cookie-store__`), o que contradiz o cookie
 * `HttpOnly`. Em vez disso, {@link browserCookies} simula o jar do navegador,
 * acessível apenas aos handlers (o "servidor"), nunca ao código da aplicação.
 */
export const REFRESH_COOKIE =
  "bb_refresh=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800";
export const CSRF_COOKIE = "bb_csrf=<token>; Secure; SameSite=Strict; Path=/";

interface ServerSession {
  id: string;
  user: AuthUser;
  refreshToken: string;
  sessionKey: string;
  csrfToken: string;
}

interface AccessTokenRecord {
  sessionId: string;
  expiresAt: number;
}

interface FailedLoginRecord {
  count: number;
  lockedUntil: number | null;
}

export type LoginAttemptOutcome =
  | { locked: false; remainingAttempts: number }
  | { locked: true; retryAfterSeconds: number };

let sessionSequence = 0;
let sessions = new Map<string, ServerSession>();
let accessTokens = new Map<string, AccessTokenRecord>();
/** Refresh tokens já rotacionados → sessão (detecção de reuso). */
let rotatedRefreshTokens = new Map<string, string>();
let failedLogins = new Map<string, FailedLoginRecord>();
let browserCookies: { refreshToken: string | null; csrfToken: string | null } = {
  refreshToken: null,
  csrfToken: null,
};

export function resetMockAuthState() {
  sessionSequence = 0;
  sessions = new Map();
  accessTokens = new Map();
  rotatedRefreshTokens = new Map();
  failedLogins = new Map();
  browserCookies = { refreshToken: null, csrfToken: null };
}

/* ------------------------------- CSRF ---------------------------------- */

/** `GET /api/auth/csrf`: reaproveita o cookie atual ou emite um novo. */
export function issueMockCsrfToken() {
  if (!browserCookies.csrfToken) {
    browserCookies.csrfToken = randomToken(24);
  }
  return browserCookies.csrfToken;
}

/** Double-submit: o header precisa ser igual ao cookie `bb_csrf`. */
export function isValidMockCsrfToken(headerValue: string | null) {
  return (
    headerValue !== null &&
    browserCookies.csrfToken !== null &&
    headerValue === browserCookies.csrfToken
  );
}

/* ----------------------------- Bloqueio -------------------------------- */

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Segundos restantes de bloqueio, ou `null` se o login está liberado. */
export function getMockLoginLock(email: string, now = Date.now()) {
  const record = failedLogins.get(normalizeEmail(email));
  if (!record?.lockedUntil) return null;

  if (record.lockedUntil <= now) {
    failedLogins.delete(normalizeEmail(email));
    return null;
  }

  return Math.ceil((record.lockedUntil - now) / 1000);
}

export function registerMockFailedLogin(
  email: string,
  now = Date.now(),
): LoginAttemptOutcome {
  const key = normalizeEmail(email);
  const count = (failedLogins.get(key)?.count ?? 0) + 1;

  if (count >= MAX_FAILED_LOGIN_ATTEMPTS) {
    failedLogins.set(key, { count, lockedUntil: now + LOGIN_LOCK_SECONDS * 1000 });
    return { locked: true, retryAfterSeconds: LOGIN_LOCK_SECONDS };
  }

  failedLogins.set(key, { count, lockedUntil: null });
  return { locked: false, remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS - count };
}

export function clearMockFailedLogins(email: string) {
  failedLogins.delete(normalizeEmail(email));
}

/* ------------------------------ Sessões -------------------------------- */

/** Login: cria a sessão, grava os cookies e devolve a concessão. */
export function createMockSession(user: AuthUser): AuthTokenResponse {
  sessionSequence += 1;
  const session: ServerSession = {
    id: `session-${sessionSequence}`,
    user,
    refreshToken: randomToken(),
    sessionKey: randomToken(32),
    // Novo token anti-CSRF a cada login (evita fixação de sessão).
    csrfToken: randomToken(24),
  };

  sessions.set(session.id, session);
  browserCookies = {
    refreshToken: session.refreshToken,
    csrfToken: session.csrfToken,
  };

  return createGrant(session);
}

/**
 * `POST /api/auth/refresh`: valida o cookie, rotaciona o refresh token e
 * emite novo access token. Reuso de um refresh token já rotacionado revoga a
 * sessão inteira.
 */
export function rotateMockSession(): AuthTokenResponse | null {
  const presented = browserCookies.refreshToken;
  if (!presented) return null;

  const session = [...sessions.values()].find(
    (item) => item.refreshToken === presented,
  );

  if (!session) {
    const reusedSessionId = rotatedRefreshTokens.get(presented);
    if (reusedSessionId) revokeSessionById(reusedSessionId);
    browserCookies.refreshToken = null;
    return null;
  }

  rotatedRefreshTokens.set(session.refreshToken, session.id);
  session.refreshToken = randomToken();
  browserCookies = {
    refreshToken: session.refreshToken,
    csrfToken: session.csrfToken,
  };

  return createGrant(session);
}

/** `POST /api/auth/logout`: revoga a sessão do cookie/Bearer e limpa cookies. */
export function revokeMockSession(authorization: string | null) {
  const fromBearer = resolveMockAccessToken(authorization);
  const fromCookie = [...sessions.values()].find(
    (item) => item.refreshToken === browserCookies.refreshToken,
  );
  const session = fromBearer ?? fromCookie;

  if (session) revokeSessionById(session.id);
  browserCookies = { refreshToken: null, csrfToken: null };
}

/** Sessão dona de um `Authorization: Bearer` válido e não expirado. */
export function resolveMockAccessToken(
  authorization: string | null,
  now = Date.now(),
): ServerSession | null {
  const match = authorization?.match(/^Bearer\s+(.+)$/);
  if (!match) return null;

  const record = accessTokens.get(match[1]);
  if (!record || record.expiresAt <= now) return null;

  return sessions.get(record.sessionId) ?? null;
}

/* --------------------------- Apoio a testes ---------------------------- */

/** Expira todos os access tokens emitidos (simula a passagem de 5 min). */
export function expireMockAccessTokens() {
  accessTokens.forEach((record) => {
    record.expiresAt = 0;
  });
}

/** Simula a perda/expiração do cookie de refresh no navegador. */
export function clearMockRefreshCookie() {
  browserCookies.refreshToken = null;
}

/* ----------------------------- Internos -------------------------------- */

function revokeSessionById(sessionId: string) {
  sessions.delete(sessionId);
  accessTokens.forEach((record, token) => {
    if (record.sessionId === sessionId) accessTokens.delete(token);
  });
}

function createGrant(session: ServerSession): AuthTokenResponse {
  const issuedAt = Math.floor(Date.now() / 1000);
  const ttlSeconds = resolveAccessTokenTtlSeconds();
  const expiresAt = issuedAt + ttlSeconds;
  const accessToken = createSimulatedJwt({
    sub: session.user.id,
    sid: session.id,
    iat: issuedAt,
    exp: expiresAt,
    jti: randomToken(12),
  });

  accessTokens.set(accessToken, {
    sessionId: session.id,
    expiresAt: expiresAt * 1000,
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: ttlSeconds,
    csrfToken: session.csrfToken,
    sessionKey: session.sessionKey,
    session: { authenticated: true, user: session.user },
  };
}

/** JWT simulado: cabeçalho e payload reais, assinatura aleatória (não verificável). */
function createSimulatedJwt(payload: Record<string, string | number>) {
  return [
    encodeJson({ alg: "HS256", typ: "JWT" }),
    encodeJson(payload),
    randomToken(32),
  ].join(".");
}

function encodeJson(value: unknown) {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
