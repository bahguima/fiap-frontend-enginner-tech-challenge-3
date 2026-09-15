import type { Transaction, TransactionDocument, TransactionStatus, TransactionViewModel } from "@banking/shared/types";
export declare function transactionDocumentToDomain<TTimestamp>(id: string, rawTransaction: TransactionDocument<TTimestamp>): Transaction;
export declare function transactionToViewModel(transaction: Transaction): TransactionViewModel;
export declare function getTransactionStatusLabel(status: TransactionStatus): string;
