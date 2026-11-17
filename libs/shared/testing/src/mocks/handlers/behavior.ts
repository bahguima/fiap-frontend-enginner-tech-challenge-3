import { delay, HttpResponse } from "msw";
import type {
  ApiErrorCode,
  ApiErrorMeta,
  ApiErrorResponse,
} from "@banking/shared/types";

const DEFAULT_DELAY_MS = 150;
const MAX_DELAY_MS = 10000;

export interface MockErrorExtras {
  meta?: ApiErrorMeta;
  headers?: HeadersInit;
}

export interface MockErrorOptions {
  status: number;
  code?: ApiErrorCode;
  message?: string;
}

export async function applyMockBehavior(
  request: Request,
  errorOptions: MockErrorOptions,
) {
  await delay(resolveDelay(request));

  if (!shouldForceError(request)) return null;

  return createErrorResponse(
    errorOptions.status,
    errorOptions.code ?? "MOCK_ERROR",
    errorOptions.message ?? "Erro simulado pela infraestrutura de mocks.",
  );
}

export function createErrorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string[]>,
  extras: MockErrorExtras = {},
) {
  return HttpResponse.json<ApiErrorResponse>(
    {
      error: {
        code,
        message,
        details,
        meta: extras.meta,
      },
    },
    { status, headers: extras.headers },
  );
}

function resolveDelay(request: Request) {
  const requestDelay = request.headers.get("x-mock-delay-ms");
  const configuredDelay =
    requestDelay ?? process.env.NEXT_PUBLIC_API_MOCK_DELAY_MS ?? `${DEFAULT_DELAY_MS}`;
  const parsedDelay = /^\d+$/.test(configuredDelay)
    ? parseInt(configuredDelay, 10)
    : DEFAULT_DELAY_MS;

  return Math.min(parsedDelay, MAX_DELAY_MS);
}

function shouldForceError(request: Request) {
  const url = new URL(request.url);
  return (
    request.headers.get("x-mock-error") === "true" ||
    url.searchParams.get("mockError") === "true"
  );
}
