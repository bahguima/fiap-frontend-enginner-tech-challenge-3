export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Concessão de sessão devolvida por `POST /api/auth/login` e
 * `POST /api/auth/refresh`.
 *
 * - `accessToken`: JWT de vida curta (`expiresIn` segundos). O cliente o
 *   mantém somente em memória e o envia em `Authorization: Bearer`.
 * - O refresh token **não** faz parte do corpo: a API o grava em um cookie
 *   `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, inacessível ao
 *   JavaScript, e o rotaciona a cada renovação.
 * - `csrfToken`: token anti-CSRF da sessão (double-submit). Todo
 *   POST/PUT/PATCH/DELETE envia o valor em `X-CSRF-Token`.
 * - `sessionKey`: material aleatório (base64url, 256 bits) vinculado à sessão
 *   do servidor, estável entre renovações e revogado no logout. O cliente
 *   deriva dele, via HKDF, a chave AES-GCM não extraível que cifra o cache
 *   persistido; o material nunca é gravado.
 */
export interface AuthTokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  csrfToken: string;
  sessionKey: string;
  session: AuthSession;
}

export type LoginResponse = AuthTokenResponse;
export type RefreshResponse = AuthTokenResponse;

/** `GET /api/auth/csrf`: token anti-CSRF para requisições anônimas (login). */
export interface CsrfTokenResponse {
  csrfToken: string;
}
