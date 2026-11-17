import type {
  TransactionsRepository,
  TransactionsRepositoryListOptions,
} from "@banking/shared/domain";
import { transactionToViewModel } from "@banking/shared/domain";
import type {
  CreateTransactionRequest,
  TransactionListFilters,
  TransactionListResponse,
  TransactionViewModel,
} from "@banking/shared/types";
import {
  CreateTransaction,
  DeleteTransaction,
  InvalidTransactionIdError,
  ListTransactions,
  UpdateTransaction,
  createTransactionUseCases,
} from "./index";

/** Repositório falso em memória: implementa a porta sem rede nem MSW. */
class InMemoryTransactionsRepository implements TransactionsRepository {
  readonly listCalls: Array<{
    filters?: TransactionListFilters;
    options?: TransactionsRepositoryListOptions;
  }> = [];
  private sequence = 0;

  constructor(private items: TransactionViewModel[] = []) {}

  async list(
    filters?: TransactionListFilters,
    options?: TransactionsRepositoryListOptions,
  ): Promise<TransactionListResponse> {
    this.listCalls.push({ filters, options });
    const items = filters?.type
      ? this.items.filter((item) => item.type === filters.type)
      : this.items;

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      firstPage: 1,
      previousPage: null,
      nextPage: null,
      lastPage: 1,
      resultsLabel: `${items.length} transações`,
    };
  }

  async create(
    transaction: CreateTransactionRequest,
  ): Promise<TransactionViewModel> {
    this.sequence += 1;
    const created = toViewModel(`fake-${this.sequence}`, transaction);
    this.items = [created, ...this.items];
    return created;
  }

  async update(
    transactionId: string,
    transaction: CreateTransactionRequest,
  ): Promise<TransactionViewModel> {
    if (!this.items.some((item) => item.id === transactionId)) {
      throw new Error("Transação não encontrada.");
    }

    const updated = toViewModel(transactionId, transaction);
    this.items = this.items.map((item) =>
      item.id === transactionId ? updated : item,
    );
    return updated;
  }

  async remove(transactionId: string): Promise<void> {
    const sizeBefore = this.items.length;
    this.items = this.items.filter((item) => item.id !== transactionId);
    if (this.items.length === sizeBefore) {
      throw new Error("Transação não encontrada.");
    }
  }
}

function toViewModel(
  id: string,
  transaction: CreateTransactionRequest,
): TransactionViewModel {
  return transactionToViewModel({
    id,
    description: transaction.description,
    observation: transaction.observation ?? "",
    amountInCents: Math.round(transaction.amount * 100),
    type: transaction.type,
    categoryId: "",
    category: transaction.category,
    date: transaction.date,
    status: transaction.status,
    attachmentCount: 0,
  });
}

const salary: CreateTransactionRequest = {
  description: "Salário",
  amount: 5000,
  type: "income",
  category: "Depósito",
  date: "2026-11-01",
  status: "completed",
};

const groceries: CreateTransactionRequest = {
  description: "Mercado",
  amount: 320.5,
  type: "expense",
  category: "Pagamento",
  date: "2026-11-02",
  status: "completed",
};

describe("casos de uso de transações", () => {
  it("ListTransactions repassa filtros e sinal de cancelamento à porta", async () => {
    const repository = new InMemoryTransactionsRepository([
      toViewModel("t-1", salary),
      toViewModel("t-2", groceries),
    ]);
    const signal = { aborted: false };

    const result = await new ListTransactions(repository).execute(
      { type: "expense" },
      { signal },
    );

    expect(result.items.map((item) => item.id)).toEqual(["t-2"]);
    expect(repository.listCalls).toEqual([
      { filters: { type: "expense" }, options: { signal } },
    ]);
  });

  it("ListTransactions usa filtros vazios por padrão", async () => {
    const repository = new InMemoryTransactionsRepository();

    await new ListTransactions(repository).execute();

    expect(repository.listCalls).toEqual([{ filters: {}, options: {} }]);
  });

  it("CreateTransaction persiste pela porta e devolve a transação criada", async () => {
    const repository = new InMemoryTransactionsRepository();

    const created = await new CreateTransaction(repository).execute(groceries);

    expect(created).toMatchObject({
      id: "fake-1",
      description: "Mercado",
      amount: -320.5,
    });
    await expect(repository.list()).resolves.toMatchObject({ total: 1 });
  });

  it("UpdateTransaction atualiza a transação existente", async () => {
    const repository = new InMemoryTransactionsRepository([
      toViewModel("t-1", salary),
    ]);

    const updated = await new UpdateTransaction(repository).execute({
      transactionId: "t-1",
      transaction: { ...salary, description: "Salário de novembro" },
    });

    expect(updated).toMatchObject({
      id: "t-1",
      description: "Salário de novembro",
    });
  });

  it("UpdateTransaction rejeita identificador vazio sem chamar a porta", async () => {
    const repository = new InMemoryTransactionsRepository();
    const update = jest.spyOn(repository, "update");

    await expect(
      new UpdateTransaction(repository).execute({
        transactionId: "  ",
        transaction: salary,
      }),
    ).rejects.toBeInstanceOf(InvalidTransactionIdError);
    expect(update).not.toHaveBeenCalled();
  });

  it("DeleteTransaction remove pela porta e propaga erros do repositório", async () => {
    const repository = new InMemoryTransactionsRepository([
      toViewModel("t-1", salary),
    ]);
    const deleteTransaction = new DeleteTransaction(repository);

    await expect(deleteTransaction.execute("t-1")).resolves.toBeUndefined();
    await expect(repository.list()).resolves.toMatchObject({ total: 0 });
    await expect(deleteTransaction.execute("t-1")).rejects.toThrow(
      "Transação não encontrada.",
    );
    await expect(deleteTransaction.execute("")).rejects.toBeInstanceOf(
      InvalidTransactionIdError,
    );
  });

  it("createTransactionUseCases compõe todos os casos de uso sobre a mesma porta", async () => {
    const repository = new InMemoryTransactionsRepository();
    const useCases = createTransactionUseCases(repository);

    const created = await useCases.createTransaction.execute(salary);
    await useCases.updateTransaction.execute({
      transactionId: created.id,
      transaction: { ...salary, amount: 5100 },
    });
    const list = await useCases.listTransactions.execute();

    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ amount: 5100 });

    await useCases.deleteTransaction.execute(created.id);
    await expect(useCases.listTransactions.execute()).resolves.toMatchObject({
      total: 0,
    });
  });
});
