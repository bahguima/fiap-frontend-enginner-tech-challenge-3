import type {
  AuthSession,
  CreateTransactionRequest,
  DashboardAmount,
  DashboardHomeResponse,
  DashboardSummaryResponse,
  Transaction,
  TransactionAttachment,
  TransactionDocument,
  TransactionListFilters,
  TransactionListResponse,
  TransactionSort,
  TransactionViewModel,
  UpdateTransactionRequest,
} from "@banking/shared/types";
import {
  aggregateFinancialTransactions,
  formatCurrencyFromCents,
  fromAmountInCents,
  toAmountInCents,
  transactionDocumentToDomain,
  transactionToViewModel,
} from "@banking/shared/domain";
import { mockAttachments } from "./fixtures/attachments";
import { mockAuthUser } from "./fixtures/auth";
import { mockCategories } from "./fixtures/categories";
import {
  mockTransactionSeeds,
  type MockTransactionSeed,
} from "./fixtures/transactions";
import { mockDashboardHome as mockDashboardHomeFixture } from "./fixtures/dashboard";

let authenticated = false;
let transactionSequence = 100;
let attachmentSequence = 100;
interface StoredTransaction {
  id: string;
  document: TransactionDocument<string>;
}

interface WebFileMetadata {
  name: string;
  type: string;
  size: number;
}

let transactionDocuments: StoredTransaction[] = [];
let attachments: TransactionAttachment[] = [];

export function resetMockState() {
  authenticated = false;
  transactionSequence = 100;
  attachmentSequence = 100;
  transactionDocuments = mockTransactionSeeds.map(createTransactionDocumentFromSeed);
  attachments = mockAttachments.map((attachment) => ({ ...attachment }));
}

export function getMockSession(): AuthSession {
  return {
    authenticated,
    user: authenticated ? mockAuthUser : null,
  };
}

export function authenticateMockSession() {
  authenticated = true;
  return getMockSession();
}

export function clearMockSession() {
  authenticated = false;
}

export function listMockTransactions(
  filters: TransactionListFilters,
): TransactionListResponse {
  let result = transactionDocuments.map(toTransaction).map(transactionToViewModel);

  if (filters.search) {
    const normalizedSearch = normalizeSearch(filters.search);
    result = result.filter((transaction) =>
      normalizeSearch(
        [
          transaction.description,
          transaction.category,
          transaction.typeLabel,
          transaction.statusLabel,
        ].join(" "),
      ).includes(normalizedSearch),
    );
  }

  if (filters.type) {
    result = result.filter((transaction) => transaction.type === filters.type);
  }

  if (filters.category) {
    result = result.filter(
      (transaction) => transaction.category === filters.category,
    );
  }

  if (filters.status) {
    result = result.filter(
      (transaction) => transaction.status === filters.status,
    );
  }

  if (filters.startDate) {
    const startDate = filters.startDate;
    result = result.filter(
      (transaction) => transaction.date >= startDate,
    );
  }

  if (filters.endDate) {
    const endDate = filters.endDate;
    result = result.filter(
      (transaction) => transaction.date <= endDate,
    );
  }

  if (filters.minimumAmount !== undefined) {
    const minimumAmount = filters.minimumAmount;
    result = result.filter(
      (transaction) => Math.abs(transaction.amount) >= minimumAmount,
    );
  }

  if (filters.maximumAmount !== undefined) {
    const maximumAmount = filters.maximumAmount;
    result = result.filter(
      (transaction) => Math.abs(transaction.amount) <= maximumAmount,
    );
  }

  const sortedTransactions = [...result].sort(
    createTransactionComparator(filters.sort ?? "date-desc"),
  );
  const total = sortedTransactions.length;
  const pageSize = Math.min(filters.pageSize ?? filters.limit ?? 10, 100);
  const totalPages = Math.ceil(total / pageSize);
  const lastPage = Math.max(totalPages, 1);
  const requestedPage = filters.limit === undefined ? filters.page ?? 1 : 1;
  const page = Math.min(requestedPage, lastPage);
  const startIndex = (page - 1) * pageSize;
  const items = sortedTransactions.slice(startIndex, startIndex + pageSize);
  const firstResult = total === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + pageSize, total);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    firstPage: 1,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
    lastPage,
    resultsLabel:
      total === 0
        ? "Nenhuma transação"
        : `Exibindo ${firstResult} a ${lastResult} de ${total} transações`,
  };
}

export function findMockTransaction(transactionId: string) {
  const storedTransaction = transactionDocuments.find(({ id }) => id === transactionId);
  return storedTransaction ? transactionToViewModel(toTransaction(storedTransaction)) : null;
}

export function createMockTransaction(request: CreateTransactionRequest) {
  transactionSequence += 1;
  const storedTransaction = createTransactionDocumentFromRequest({
    id: `transaction-${transactionSequence}`,
    ...request,
  });

  transactionDocuments = [storedTransaction, ...transactionDocuments];
  return transactionToViewModel(toTransaction(storedTransaction));
}

export function updateMockTransaction(
  transactionId: string,
  request: UpdateTransactionRequest,
) {
  const currentTransaction = findMockTransaction(transactionId);

  if (!currentTransaction) return null;

  const updatedTransaction = createTransactionDocumentFromRequest({
    id: transactionId,
    ...request,
  }, currentTransaction.attachmentCount);

  transactionDocuments = transactionDocuments.map((transaction) =>
    transaction.id === transactionId ? updatedTransaction : transaction,
  );

  return transactionToViewModel(toTransaction(updatedTransaction));
}

export function deleteMockTransaction(transactionId: string) {
  const currentTransaction = findMockTransaction(transactionId);

  if (!currentTransaction) return false;

  transactionDocuments = transactionDocuments.filter(
    (transaction) => transaction.id !== transactionId,
  );
  attachments = attachments.filter(
    (attachment) => attachment.transactionId !== transactionId,
  );
  return true;
}

export function getMockDashboardSummary(): DashboardSummaryResponse {
  const aggregation = aggregateFinancialTransactions(
    transactionDocuments.map(toTransaction),
  );

  return {
    balance: createDashboardAmount(aggregation.balanceInCents),
    totalIncome: createDashboardAmount(aggregation.totalIncomeInCents),
    totalExpense: createDashboardAmount(aggregation.totalExpenseInCents),
    savings: createDashboardAmount(aggregation.balanceInCents),
  };
}

export function getMockDashboardHome(): DashboardHomeResponse {
  const transactions = transactionDocuments.map(toTransaction).map(transactionToViewModel);
  return {
    ...mockDashboardHomeFixture,
    recentTransactions: {
      ...mockDashboardHomeFixture.recentTransactions,
      firstTransaction: transactions[0] ?? null,
      secondTransaction: transactions[1] ?? null,
      thirdTransaction: transactions[2] ?? null,
      fourthTransaction: transactions[3] ?? null,
      fifthTransaction: transactions[4] ?? null,
    },
  };
}

export function listMockAttachments(transactionId: string) {
  return attachments.filter(
    (attachment) => attachment.transactionId === transactionId,
  );
}

export function createMockAttachment(
  transactionId: string,
  file: WebFileMetadata,
) {
  attachmentSequence += 1;
  const attachmentId = `attachment-${attachmentSequence}`;
  const attachment: TransactionAttachment = {
    id: attachmentId,
    transactionId,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    formattedSize: formatFileSize(file.size),
    uploadedAt: "2026-07-23T12:00:00.000Z",
    downloadUrl: `/api/attachments/${attachmentId}/content`,
  };

  attachments = [attachment, ...attachments];
  updateMockTransactionAttachmentCount(transactionId, 1);
  return attachment;
}

export function deleteMockAttachment(attachmentId: string) {
  const attachment = attachments.find((item) => item.id === attachmentId);

  if (!attachment) return false;

  attachments = attachments.filter((item) => item.id !== attachmentId);
  updateMockTransactionAttachmentCount(attachment.transactionId, -1);
  return true;
}

function createTransactionDocumentFromSeed(seed: MockTransactionSeed) {
  const attachmentCount = mockAttachments.filter(
    (attachment) => attachment.transactionId === seed.id,
  ).length;

  return createTransactionDocument(seed, seed.amountInCents, attachmentCount);
}

function createTransactionDocumentFromRequest(
  seed: CreateTransactionRequest & { id: string },
  attachmentCount = 0,
) {
  return createTransactionDocument(
    seed,
    toAmountInCents(Math.abs(seed.amount)),
    attachmentCount,
  );
}

function createTransactionDocument(
  seed: Omit<MockTransactionSeed, "amountInCents">,
  amountInCents: number,
  attachmentCount: number,
): StoredTransaction {
  const observation = seed.observation?.trim() ?? "";
  const category = mockCategories.find((item) => item.name === seed.category);
  const timestamp = "2026-07-23T12:00:00.000Z";

  return {
    id: seed.id,
    document: {
      description: seed.description.trim(),
      observation,
      amountInCents,
      type: seed.type,
      categoryId: category?.id ?? "category-unknown",
      categoryName: seed.category,
      occurredOn: seed.date,
      status: seed.status,
      attachmentCount,
      createdAt: timestamp,
      updatedAt: timestamp,
      schemaVersion: 1,
    },
  };
}

function updateMockTransactionAttachmentCount(
  transactionId: string,
  difference: 1 | -1,
) {
  transactionDocuments = transactionDocuments.map((transaction) => {
    if (transaction.id !== transactionId) return transaction;

    return {
      ...transaction,
      document: {
        ...transaction.document,
        attachmentCount: Math.max(
          0,
          transaction.document.attachmentCount + difference,
        ),
        updatedAt: "2026-07-23T12:00:00.000Z",
      },
    };
  });
}

function toTransaction(storedTransaction: StoredTransaction): Transaction {
  return transactionDocumentToDomain(storedTransaction.id, storedTransaction.document);
}

function createDashboardAmount(amountInCents: number): DashboardAmount {
  return {
    value: fromAmountInCents(amountInCents),
    formattedValue: formatCurrencyFromCents(amountInCents),
  };
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} bytes`;
  return `${Math.round(size / 1024)} KB`;
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function createTransactionComparator(sort: TransactionSort) {
  if (sort === "date-asc") {
    return (first: TransactionViewModel, second: TransactionViewModel) =>
      first.date.localeCompare(second.date);
  }

  if (sort === "amount-desc") {
    return (first: TransactionViewModel, second: TransactionViewModel) =>
      Math.abs(second.amount) - Math.abs(first.amount);
  }

  if (sort === "amount-asc") {
    return (first: TransactionViewModel, second: TransactionViewModel) =>
      Math.abs(first.amount) - Math.abs(second.amount);
  }

  if (sort === "description-asc") {
    return (first: TransactionViewModel, second: TransactionViewModel) =>
      first.description.localeCompare(second.description, "pt-BR");
  }

  if (sort === "description-desc") {
    return (first: TransactionViewModel, second: TransactionViewModel) =>
      second.description.localeCompare(first.description, "pt-BR");
  }

  return (first: TransactionViewModel, second: TransactionViewModel) =>
    second.date.localeCompare(first.date);
}

resetMockState();
