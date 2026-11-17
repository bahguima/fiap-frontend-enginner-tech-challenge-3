export type ApiErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "UNAUTHORIZED"
  | "CSRF_TOKEN_INVALID"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "MOCK_ERROR"
  | "INTERNAL_ERROR";

/** Metadados estruturados de erros de autenticação (sem dados pessoais). */
export interface ApiErrorMeta {
  /** Tentativas de login restantes antes do bloqueio. */
  remainingAttempts?: number;
  /** Segundos até o fim do bloqueio (espelha o header `Retry-After`). */
  retryAfterSeconds?: number;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string[]>;
  meta?: ApiErrorMeta;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface ApiMessageResponse {
  message: string;
}
