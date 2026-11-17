import type { AuthTokenResponse, AuthUser } from "@banking/shared/types";

export type SessionEndReason = "logout" | "expired" | "idle";

/**
 * Eventos do ciclo de vida da sessão, para quem precisa reagir a ela sem
 * enxergar tokens (ex.: `AuthProvider` limpa o cache; o shell liga/desliga a
 * persistência criptografada).
 *
 * - `established`: primeira concessão após um estado anônimo (login ou
 *   restauração por refresh após recarregar). Carrega o `sessionKey` para a
 *   derivação da chave de criptografia; o store não o retém.
 * - `renewed`: rotação silenciosa dos tokens (refresh) da mesma sessão.
 * - `ended`: logout, inatividade ou falha de renovação.
 */
export type AuthSessionEvent =
  | { type: "established"; user: AuthUser | null; sessionKey: string }
  | { type: "renewed" }
  | { type: "ended"; reason: SessionEndReason };

export type AuthSessionListener = (event: AuthSessionEvent) => void;

/**
 * Credenciais da sessão mantidas **somente em memória** (closure do módulo):
 * nunca em `localStorage`, `sessionStorage` ou cookies legíveis por
 * JavaScript. Recarregar a página descarta tudo; a sessão é restaurada pelo
 * refresh token em cookie `HttpOnly`, que o JavaScript não lê.
 *
 * Também coordena as operações que precisam ser únicas mesmo com várias
 * requisições concorrentes (refresh e obtenção do token anti-CSRF).
 */
export class AuthSessionStore {
  private accessToken: string | null = null;
  /** Muda a cada nova sessão, fim de sessão ou reset (não em renovações). */
  private generation = 0;
  private csrfToken: string | null = null;
  private refreshInFlight: Promise<boolean> | null = null;
  private csrfInFlight: Promise<string> | null = null;
  private readonly listeners = new Set<AuthSessionListener>();

  getAccessToken() {
    return this.accessToken;
  }

  hasAccessToken() {
    return this.accessToken !== null;
  }

  getGeneration() {
    return this.generation;
  }

  getCsrfToken() {
    return this.csrfToken;
  }

  setCsrfToken(token: string | null) {
    this.csrfToken = token;
  }

  /**
   * Aplica uma concessão e notifica os assinantes. `login` sempre inicia
   * uma nova sessão (novo `sessionKey`); `refresh` só é nova sessão quando
   * não havia token em memória (restauração após recarregar).
   */
  applyGrant(grant: AuthTokenResponse, origin: "login" | "refresh" = "refresh") {
    const isNewSession = origin === "login" || this.accessToken === null;
    if (isNewSession) this.generation += 1;
    this.accessToken = grant.accessToken;
    this.csrfToken = grant.csrfToken;

    this.emit(
      isNewSession
        ? {
            type: "established",
            user: grant.session.user,
            sessionKey: grant.sessionKey,
          }
        : { type: "renewed" },
    );
  }

  /**
   * Descarta as credenciais; notifica somente se havia sessão ativa. Com
   * `expectedGeneration`, só encerra se ainda for a mesma sessão (um refresh
   * antigo que falhe não derruba uma sessão iniciada depois dele).
   */
  end(reason: SessionEndReason, expectedGeneration?: number) {
    if (
      expectedGeneration !== undefined &&
      expectedGeneration !== this.generation
    ) {
      return;
    }

    const hadSession = this.accessToken !== null;
    if (hadSession) this.generation += 1;
    this.accessToken = null;
    this.csrfToken = null;

    if (hadSession) this.emit({ type: "ended", reason });
  }

  /**
   * Refresh single-flight: chamadas concorrentes recebem a mesma promessa e
   * apenas uma requisição de renovação é feita.
   */
  runRefresh(task: () => Promise<boolean>): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = task().finally(() => {
        this.refreshInFlight = null;
      });
    }

    return this.refreshInFlight;
  }

  /** Obtenção single-flight do token anti-CSRF. */
  runCsrf(task: () => Promise<string>): Promise<string> {
    if (!this.csrfInFlight) {
      this.csrfInFlight = task().finally(() => {
        this.csrfInFlight = null;
      });
    }

    return this.csrfInFlight;
  }

  subscribe(listener: AuthSessionListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Zera o estado sem notificar (isolamento entre testes). */
  reset() {
    this.generation += 1;
    this.accessToken = null;
    this.csrfToken = null;
    this.refreshInFlight = null;
    this.csrfInFlight = null;
  }

  private emit(event: AuthSessionEvent) {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }
}

/**
 * Instância única da sessão. Em Module Federation, `@banking/shared/api-client`
 * é singleton no share scope, então shell e remotes enxergam o mesmo store.
 */
export const authSession = new AuthSessionStore();
