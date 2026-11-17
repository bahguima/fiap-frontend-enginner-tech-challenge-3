import {
  createTransactionUseCases,
  type TransactionUseCases,
} from "@banking/shared/application";
import { RestTransactionsRepository } from "@banking/shared/api-client";

/**
 * Composition root de transações: único ponto do remote que conhece a
 * implementação concreta (REST) da porta `TransactionsRepository`.
 */
export function createRestTransactionUseCases(): TransactionUseCases {
  return createTransactionUseCases(new RestTransactionsRepository());
}
