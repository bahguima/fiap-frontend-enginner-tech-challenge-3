import type {
  CreateTransactionRequest,
  TransactionListResponse,
  TransactionViewModel,
} from "@banking/shared/types";
import {
  addTransactionToList,
  createOptimisticTransaction,
  removeTransactionFromList,
  replaceTransactionInList,
  transactionMatchesListFilters,
} from "./optimisticTransactionList";

const request: CreateTransactionRequest = {
  description: "Conta de luz",
  amount: 180.4,
  type: "expense",
  category: "Pagamento",
  date: "2026-11-10",
  status: "pending",
};

function createTransaction(
  id: string,
  overrides: Partial<CreateTransactionRequest> = {},
): TransactionViewModel {
  const transaction = createOptimisticTransaction(
    { ...request, ...overrides },
    { id },
  );
  if (!transaction) throw new Error("fixture inválida");
  return transaction;
}

function createList(items: TransactionViewModel[]): TransactionListResponse {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 2,
    totalPages: 1,
    firstPage: 1,
    previousPage: null,
    nextPage: null,
    lastPage: 1,
    resultsLabel: "",
  };
}

describe("atualização otimista de listas de transações", () => {
  it("cria um view model provisório com os rótulos do domínio", () => {
    expect(
      createOptimisticTransaction(request, { id: "tmp-1", attachmentCount: 2 }),
    ).toMatchObject({
      id: "tmp-1",
      amount: -180.4,
      formattedAmount: "-R$ 180,40",
      typeLabel: "Saída",
      statusLabel: "Pendente",
      attachmentCount: 2,
      editableFields: { amount: 180.4, observation: "" },
    });
  });

  it("não cria view model provisório para valores inválidos", () => {
    expect(
      createOptimisticTransaction(
        { ...request, amount: Number.NaN },
        { id: "tmp-1" },
      ),
    ).toBeNull();
  });

  it("verifica se a transação atende aos filtros da lista", () => {
    const transaction = createTransaction("tmp-1");

    expect(transactionMatchesListFilters(transaction, {})).toBe(true);
    expect(
      transactionMatchesListFilters(transaction, {
        type: "expense",
        search: "LUZ",
        minimumAmount: 100,
        maximumAmount: 200,
        startDate: "2026-11-01",
        endDate: "2026-11-30",
      }),
    ).toBe(true);
    expect(transactionMatchesListFilters(transaction, { type: "income" })).toBe(
      false,
    );
    expect(
      transactionMatchesListFilters(transaction, { status: "completed" }),
    ).toBe(false);
    expect(
      transactionMatchesListFilters(transaction, { endDate: "2026-11-09" }),
    ).toBe(false);
  });

  it("insere no topo da primeira página respeitando o tamanho da página", () => {
    const list = createList([createTransaction("a"), createTransaction("b")]);
    const optimistic = createTransaction("tmp-1");

    const result = addTransactionToList(list, {}, optimistic);

    expect(result.items.map((item) => item.id)).toEqual(["tmp-1", "a"]);
    expect(result.total).toBe(3);
    expect(list.items.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("não insere em outras páginas, ordenações ou filtros incompatíveis", () => {
    const list = createList([createTransaction("a")]);
    const optimistic = createTransaction("tmp-1");

    expect(addTransactionToList(list, { page: 2 }, optimistic)).toBe(list);
    expect(addTransactionToList(list, { sort: "amount-asc" }, optimistic)).toBe(
      list,
    );
    expect(addTransactionToList(list, { type: "income" }, optimistic)).toBe(list);
  });

  it("substitui e remove transações existentes sem alterar listas que não as contêm", () => {
    const list = createList([createTransaction("a"), createTransaction("b")]);
    const edited = createTransaction("b", { description: "Conta de água" });

    expect(
      replaceTransactionInList(list, edited).items.map(
        (item) => item.description,
      ),
    ).toEqual(["Conta de luz", "Conta de água"]);
    expect(replaceTransactionInList(list, createTransaction("z"))).toBe(list);

    const withoutA = removeTransactionFromList(list, "a");
    expect(withoutA.items.map((item) => item.id)).toEqual(["b"]);
    expect(withoutA.total).toBe(1);
    expect(removeTransactionFromList(list, "z")).toBe(list);
  });
});
