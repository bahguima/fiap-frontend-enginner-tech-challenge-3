import type {
  ApiErrorCode,
  ApiErrorMeta,
  ApiErrorResponse,
  AuthTokenResponse,
  CsrfTokenResponse,
} from "@banking/shared/types";
import { apiEndpoints } from "./endpoints";
import { authSession, type AuthSessionStore } from "./session";

export type RestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Métodos que alteram estado e exigem `X-CSRF-Token`. */
const STATE_CHANGING_METHODS = new Set<RestMethod>([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export const CSRF_HEADER = "X-CSRF-Token";

export interface RestRequestOptions<RequestBody> {
  method?: RestMethod;
  body?: RequestBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  /**
   * Revalidação condicional (somente GET): reenvia o último `ETag` em
   * `If-None-Match` e, em `304 Not Modified`, devolve o corpo já recebido.
   * Use apenas em recursos públicos/não sensíveis (ex.: categorias); o corpo
   * validado fica somente em memória.
   */
  conditional?: boolean;
  /**
   * Não tenta renovar a sessão em `401` (ex.: login, em que `401` significa
   * credenciais inválidas e não token expirado).
   */
  skipAuthRefresh?: boolean;
}

interface ValidatedResponse {
  etag: string;
  body: unknown;
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface RestClientOptions {
  baseUrl?: string;
  fetcher?: Fetcher;
  /** Store de credenciais em memória; por padrão o singleton da sessão. */
  session?: AuthSessionStore;
}

export interface MultipartRequestOptions {
  method?: "POST" | "PUT" | "PATCH";
  signal?: AbortSignal;
}

interface SendOptions {
  method: RestMethod;
  signal?: AbortSignal;
  skipAuthRefresh?: boolean;
  /** Monta headers/corpo a cada tentativa (o corpo pode ser reenviado). */
  buildInit: () => { headers: Headers; body?: BodyInit };
}

export class RestClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: Record<string, string[]> | null;
  readonly meta: ApiErrorMeta | null;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details: Record<string, string[]> | null = null,
    meta: ApiErrorMeta | null = null,
  ) {
    super(message);
    this.name = "RestClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.meta = meta;
  }
}

export class RestClient {
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher | null;
  private readonly session: AuthSessionStore;
  private readonly validatedResponses = new Map<string, ValidatedResponse>();

  constructor(options: RestClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    this.fetcher = options.fetcher ?? null;
    this.session = options.session ?? authSession;
  }

  async request<ResponseBody, RequestBody = never>(
    path: string,
    options: RestRequestOptions<RequestBody> = {},
  ): Promise<ResponseBody> {
    const method = options.method ?? "GET";
    const url = this.resolveUrl(path);
    const conditional = options.conditional === true && method === "GET";
    const validated = conditional ? this.validatedResponses.get(url) : undefined;

    const response = await this.send(url, {
      method,
      signal: options.signal,
      skipAuthRefresh: options.skipAuthRefresh,
      buildInit: () => {
        const headers = new Headers(options.headers);
        let body: BodyInit | undefined;

        if (options.body !== undefined) {
          headers.set("Content-Type", "application/json");
          body = JSON.stringify(options.body);
        }

        if (validated) {
          headers.set("If-None-Match", validated.etag);
        }

        return { headers, body };
      },
    });

    if (response.status === 304 && validated) {
      return validated.body as ResponseBody;
    }

    if (!response.ok) {
      throw await createRestClientError(response);
    }

    const body: ResponseBody = await response.json();
    const etag = response.headers.get("ETag");

    if (conditional && etag) {
      this.validatedResponses.set(url, { etag, body });
    }

    return body;
  }

  async requestMultipart<ResponseBody>(
    path: string,
    body: FormData,
    options: MultipartRequestOptions = {},
  ): Promise<ResponseBody> {
    const response = await this.send(this.resolveUrl(path), {
      method: options.method ?? "POST",
      signal: options.signal,
      buildInit: () => ({ headers: new Headers(), body }),
    });

    if (!response.ok) {
      throw await createRestClientError(response);
    }

    return response.json();
  }

  /**
   * Renova a sessão usando o refresh token do cookie `HttpOnly`.
   *
   * Single-flight: requisições simultâneas que recebem `401` aguardam a mesma
   * renovação. Rejeição do refresh token (`401`) encerra a sessão
   * (`ended: expired`); falhas transitórias (rede/5xx) apenas devolvem
   * `false`, sem derrubar a sessão. Token anti-CSRF desatualizado é
   * renovado e o refresh é repetido uma vez.
   */
  refreshSession(): Promise<boolean> {
    return this.session.runRefresh(async () => {
      const generation = this.session.getGeneration();
      const attempt = async () => {
        const headers = new Headers();
        headers.set(CSRF_HEADER, await this.ensureCsrfToken());
        return this.fetch(this.resolveUrl(apiEndpoints.auth.refresh), {
          method: "POST",
          headers,
          credentials: "include",
        });
      };
      let response: Response;

      try {
        response = await attempt();

        if (
          response.status === 403 &&
          (await hasErrorCode(response, "CSRF_TOKEN_INVALID"))
        ) {
          this.session.setCsrfToken(null);
          response = await attempt();
        }
      } catch {
        return false;
      }

      // Login/logout durante a renovação: o resultado é de outra sessão.
      if (generation !== this.session.getGeneration()) {
        return this.session.hasAccessToken();
      }

      if (response.ok) {
        this.session.applyGrant((await response.json()) as AuthTokenResponse);
        return true;
      }

      if (response.status === 401) {
        this.session.end("expired", generation);
      }

      return false;
    });
  }

  private async send(url: string, options: SendOptions): Promise<Response> {
    let response = await this.dispatch(url, options);

    if (
      STATE_CHANGING_METHODS.has(options.method) &&
      response.status === 403 &&
      (await hasErrorCode(response, "CSRF_TOKEN_INVALID"))
    ) {
      // Token anti-CSRF ausente/rotacionado: obtém outro e repete uma vez.
      this.session.setCsrfToken(null);
      response = await this.dispatch(url, options);
    }

    if (response.status === 401 && !options.skipAuthRefresh) {
      const renewed = await this.refreshSession();

      if (renewed) {
        // Repete a requisição original uma única vez com o novo token.
        response = await this.dispatch(url, options);
      }
    }

    return response;
  }

  private async dispatch(url: string, options: SendOptions) {
    const { headers, body } = options.buildInit();
    const accessToken = this.session.getAccessToken();

    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    if (STATE_CHANGING_METHODS.has(options.method)) {
      headers.set(CSRF_HEADER, await this.ensureCsrfToken());
    }

    return this.fetch(url, {
      method: options.method,
      headers,
      body,
      signal: options.signal,
      credentials: "include",
    });
  }

  private async ensureCsrfToken(): Promise<string> {
    const current = this.session.getCsrfToken();
    if (current) return current;

    return this.session.runCsrf(async () => {
      const response = await this.fetch(this.resolveUrl(apiEndpoints.auth.csrf), {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw await createRestClientError(response);
      }

      const { csrfToken } = (await response.json()) as CsrfTokenResponse;
      this.session.setCsrfToken(csrfToken);
      return csrfToken;
    });
  }

  private fetch(input: string, init: RequestInit) {
    const fetcher = this.fetcher ?? fetch;
    return fetcher(input, init);
  }

  private resolveUrl(path: string) {
    if (this.baseUrl) {
      return new URL(path, this.baseUrl).toString();
    }

    if (globalThis.location?.origin) {
      return new URL(path, globalThis.location.origin).toString();
    }

    return path;
  }
}

async function hasErrorCode(response: Response, code: ApiErrorCode) {
  try {
    const body = (await response.clone().json()) as Partial<ApiErrorResponse>;
    return body.error?.code === code;
  } catch {
    return false;
  }
}

async function createRestClientError(response: Response) {
  let errorResponse: ApiErrorResponse | null = null;

  try {
    errorResponse = await response.json();
  } catch {
    return new RestClientError(
      response.status,
      "INTERNAL_ERROR",
      "Não foi possível processar a resposta da API.",
    );
  }

  if (
    !errorResponse ||
    !errorResponse.error ||
    !errorResponse.error.code ||
    !errorResponse.error.message
  ) {
    return new RestClientError(
      response.status,
      "INTERNAL_ERROR",
      "A API retornou um erro sem conteúdo.",
    );
  }

  return new RestClientError(
    response.status,
    errorResponse.error.code,
    errorResponse.error.message,
    errorResponse.error.details ?? null,
    errorResponse.error.meta ?? null,
  );
}

export const restClient = new RestClient();
