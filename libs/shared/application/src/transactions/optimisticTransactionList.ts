import { toAmountInCents, transactionToViewModel } from "@banking/shared/domain";
import type {
  CreateTransactionRequest,
  TransactionListFilters,
  TransactionListResponse,
  TransactionViewModel,
  UpdateTransactionRequest,
} from "@banking/shared/types";

/**
 * Transformações puras usadas pela atualização otimista do cache de listas.
 * Elas só aproximam o resultado esperado; a resposta da API continua sendo a
 * fonte de verdade e substitui estes valores quando as queries são
 * revalidadas.
 */

export interface OptimisticTransactionOptions {
  id: string;
  attachmentCount?: number;
  categoryId?: string;
}

export function createOptimisticTransaction(
  transaction: CreateTransactionRequest | UpdateTransactionRequest,
  { id, attachmentCount = 0, categoryId = "" }: OptimisticTransactionOptions,
): TransactionViewModel | null {
  try {
    return transactionToViewModel({
      id,
      description: transaction.description,
      observation: transaction.observation ?? "",
      amountInCents: Math.abs(toAmountInCents(transaction.amount)),
      type: transaction.type,
      categoryId,
      category: transaction.category,
      date: transaction.date,
      status: transaction.status,
      attachmentCount,
    });
  } catch {
    return null;
  }
}

export function transactionMatchesListFilters(
  transaction: TransactionViewModel,
  filters: TransactionListFilters,
): boolean {
  const absoluteAmount = Math.abs(transaction.amount);
  const search = filters.search?.trim().toLocaleLowerCase("pt-BR");

  if (filters.type && transaction.type !== filters.type) return false;
  if (filters.category && transaction.category !== filters.category) {
    return false;
  }
  if (filters.status && transaction.status !== filters.status) return false;
  if (filters.startDate && transaction.date < filters.startDate) return false;
  if (filters.endDate && transaction.date > filters.endDate) return false;
  if (
    filters.minimumAmount !== undefined &&
    absoluteAmount < filters.minimumAmount
  ) {
    return false;
  }
  if (
    filters.maximumAmount !== undefined &&
    absoluteAmount > filters.maximumAmount
  ) {
    return false;
  }
  if (
    search &&
    !transaction.description.toLocaleLowerCase("pt-BR").includes(search)
  ) {
    return false;
  }

  return true;
}

/**
 * Insere a transação no topo da primeira página quando a lista usa a
 * ordenação padrão (data mais recente) e os filtros a aceitam. Outras
 * ordenações e páginas são deixadas para a revalidação.
 */
export function addTransactionToList(
  list: TransactionListResponse,
  filters: TransactionListFilters,
  transaction: TransactionViewModel,
): TransactionListResponse {
  const isFirstPage = (filters.page ?? 1) === 1;
  const usesDefaultSort = !filters.sort || filters.sort === "date-desc";

  if (
    !isFirstPage ||
    !usesDefaultSort ||
    !transactionMatchesListFilters(transaction, filters)
  ) {
    return list;
  }

  const maximumItems = filters.limit ?? filters.pageSize ?? list.pageSize;
  const items = [transaction, ...list.items].slice(
    0,
    Math.max(maximumItems, 1),
  );

  return { ...list, items, total: list.total + 1 };
}

export function replaceTransactionInList(
  list: TransactionListResponse,
  transaction: TransactionViewModel,
): TransactionListResponse {
  if (!list.items.some((item) => item.id === transaction.id)) return list;

  return {
    ...list,
    items: list.items.map((item) =>
      item.id === transaction.id ? transaction : item,
    ),
  };
}

export function removeTransactionFromList(
  list: TransactionListResponse,
  transactionId: string,
): TransactionListResponse {
  if (!list.items.some((item) => item.id === transactionId)) return list;

  return {
    ...list,
    items: list.items.filter((item) => item.id !== transactionId),
    total: Math.max(list.total - 1, 0),
  };
}
