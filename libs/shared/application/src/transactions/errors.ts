export class InvalidTransactionIdError extends Error {
  constructor() {
    super("Informe o identificador da transação.");
    this.name = "InvalidTransactionIdError";
  }
}

export function assertTransactionId(transactionId: string): void {
  if (transactionId.trim().length === 0) {
    throw new InvalidTransactionIdError();
  }
}
