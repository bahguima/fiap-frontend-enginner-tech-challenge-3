export type TransactionsRepositoryOperation =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "list"
  | "list-categories";

export type TransactionsRepositoryErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "not-found"
  | "invalid-argument"
  | "invalid-data"
  | "conflict"
  | "unavailable"
  | "unknown";

const ERROR_MESSAGES: Record<TransactionsRepositoryErrorCode, string> = {
  unauthenticated: "É necessário entrar novamente para continuar.",
  "permission-denied": "Você não tem permissão para acessar estas transações.",
  "not-found": "A transação solicitada não foi encontrada.",
  "invalid-argument": "Os dados informados para a transação são inválidos.",
  "invalid-data": "Os dados armazenados da transação são inválidos.",
  conflict: "A transação foi alterada por outra operação.",
  unavailable: "O serviço de transações está temporariamente indisponível.",
  unknown: "Não foi possível concluir a operação com a transação.",
};

export class TransactionsRepositoryError extends Error {
  readonly code: TransactionsRepositoryErrorCode;
  readonly operation: TransactionsRepositoryOperation;
  override readonly cause?: unknown;

  constructor(
    code: TransactionsRepositoryErrorCode,
    operation: TransactionsRepositoryOperation,
    options?: { cause?: unknown; message?: string },
  ) {
    super(options?.message ?? ERROR_MESSAGES[code]);
    this.name = "TransactionsRepositoryError";
    this.code = code;
    this.operation = operation;
    this.cause = options?.cause;
  }
}

function firebaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  if (typeof code !== "string") return undefined;

  return code.includes("/") ? code.slice(code.lastIndexOf("/") + 1) : code;
}

export function toTransactionsRepositoryError(
  error: unknown,
  operation: TransactionsRepositoryOperation,
): TransactionsRepositoryError {
  if (error instanceof TransactionsRepositoryError) {
    if (error.operation === operation) return error;

    return new TransactionsRepositoryError(error.code, operation, {
      cause: error,
      message: error.message,
    });
  }

  const code = firebaseErrorCode(error);
  const mappedCode: TransactionsRepositoryErrorCode =
    code === "unauthenticated"
      ? "unauthenticated"
      : code === "permission-denied"
        ? "permission-denied"
        : code === "not-found"
          ? "not-found"
          : code === "invalid-argument" || code === "failed-precondition"
            ? "invalid-argument"
            : code === "already-exists" || code === "aborted"
              ? "conflict"
              : code === "unavailable" || code === "deadline-exceeded"
                ? "unavailable"
                : "unknown";

  return new TransactionsRepositoryError(mappedCode, operation, {
    cause: error,
  });
}

export function requireAuthenticatedUid(
  uid: string | null | undefined,
  operation: TransactionsRepositoryOperation,
): string {
  const normalizedUid = uid?.trim();

  if (!normalizedUid) {
    throw new TransactionsRepositoryError("unauthenticated", operation);
  }

  return normalizedUid;
}
