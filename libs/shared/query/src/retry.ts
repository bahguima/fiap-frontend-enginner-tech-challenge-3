/** Número máximo de novas tentativas para falhas transitórias (5xx/rede). */
export const MAX_QUERY_RETRIES = 2;

const BASE_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 4000;

/**
 * Lê o status HTTP de um erro sem depender da classe concreta do cliente
 * (infraestrutura): qualquer erro com `status` numérico é aceito.
 */
function getHttpStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Retry inteligente:
 * - 4xx (validação, autenticação, autorização, não encontrado) não são
 *   repetidos, pois a mesma requisição falharia de novo;
 * - 5xx e falhas de rede (sem status) são repetidos até
 *   {@link MAX_QUERY_RETRIES} vezes;
 * - cancelamentos nunca são repetidos.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (isAbortError(error)) return false;

  const status = getHttpStatus(error);
  if (status !== null && status >= 400 && status < 500) return false;

  return failureCount < MAX_QUERY_RETRIES;
}

/** Backoff exponencial (500 ms, 1 s, 2 s...) limitado a 4 s. */
export function queryRetryDelay(attemptIndex: number) {
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}
