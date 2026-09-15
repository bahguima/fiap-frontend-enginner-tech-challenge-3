import { act, fireEvent, screen } from "@testing-library/react-native";
import { RefreshControl } from "react-native";

import {
  useTransactionCategoriesQuery,
  useTransactionsInfiniteQuery,
} from "@mobile/features/transactions/hooks";
import { renderWithTheme } from "@mobile/test/render";
import { TransactionsScreen } from "./TransactionsScreen";

jest.mock("@mobile/features/transactions/hooks", () => ({
  useTransactionCategoriesQuery: jest.fn(),
  useTransactionsInfiniteQuery: jest.fn(),
}));

const mockUseTransactions = jest.mocked(useTransactionsInfiniteQuery);
const mockUseCategories = jest.mocked(useTransactionCategoriesQuery);

const salary = {
  id: "tx-salary",
  description: "Depósito de salário",
  observation: "",
  amountInCents: 750_000,
  type: "income" as const,
  categoryId: "salary",
  category: "Salário",
  date: "2026-09-05",
  status: "completed" as const,
  attachmentCount: 0,
};

const market = {
  id: "tx-market",
  description: "Supermercado",
  observation: "Compra mensal",
  amountInCents: 28_590,
  type: "expense" as const,
  categoryId: "groceries",
  category: "Alimentação",
  date: "2026-09-08",
  status: "pending" as const,
  attachmentCount: 1,
};

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { pages: [{ items: [salary, market] }], pageParams: [undefined] },
    fetchNextPage: jest.fn().mockResolvedValue(undefined),
    hasNextPage: false,
    isError: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isPending: false,
    isRefetching: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useTransactionsInfiniteQuery>;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockUseTransactions.mockReturnValue(queryResult());
  mockUseCategories.mockReturnValue({
    data: [
      { id: "groceries", name: "Alimentação", type: "expense" },
      { id: "salary", name: "Salário", type: "income" },
    ],
  } as ReturnType<typeof useTransactionCategoriesQuery>);
});

afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe("TransactionsScreen", () => {
  it("renderiza a lista com data e moeda formatadas e navega para detalhes", () => {
    const onTransactionPress = jest.fn();
    renderWithTheme(
      <TransactionsScreen onTransactionPress={onTransactionPress} />,
    );

    expect(screen.getByText("2 movimentações")).toBeOnTheScreen();
    expect(screen.getByText("Depósito de salário")).toBeOnTheScreen();
    expect(
      screen.getByLabelText(/entrada de R\$\s?7\.500,00, 05\/09\/2026/),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText(/Depósito de salário/));
    expect(onTransactionPress).toHaveBeenCalledWith("tx-salary");
  });

  it("aplica data, categoria, tipo, status e ordenação pelo modal", () => {
    renderWithTheme(<TransactionsScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.changeText(screen.getByLabelText("Data inicial"), "2026-09-01");
    fireEvent.changeText(screen.getByLabelText("Data final"), "2026-09-30");
    fireEvent.press(screen.getByRole("radio", { name: "Tipo: Saídas" }));
    fireEvent.press(
      screen.getByRole("radio", { name: "Status: Pendentes" }),
    );
    fireEvent.press(
      screen.getByRole("radio", { name: "Categoria: Alimentação" }),
    );
    fireEvent.press(
      screen.getByRole("radio", { name: "Ordenação: Mais antigas" }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(mockUseTransactions).toHaveBeenLastCalledWith({
      categoryId: "groceries",
      endDate: "2026-09-30",
      pageSize: 20,
      sort: "date-asc",
      startDate: "2026-09-01",
      status: "pending",
      type: "expense",
    });
    expect(
      screen.getByRole("button", { name: "Filtros, 6 ativos" }),
    ).toBeOnTheScreen();
  });

  it("limpa todos os filtros aplicados", () => {
    renderWithTheme(<TransactionsScreen initialFilter="income" />);

    fireEvent.press(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(mockUseTransactions).toHaveBeenLastCalledWith({
      pageSize: 20,
      sort: "date-desc",
    });
    expect(screen.getByRole("button", { name: "Filtros" })).toBeOnTheScreen();
  });

  it("carrega a próxima página uma única vez para eventos duplicados", async () => {
    let finishRequest: () => void = () => undefined;
    const pendingRequest = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });
    const fetchNextPage = jest.fn(() => pendingRequest);
    mockUseTransactions.mockReturnValue(
      queryResult({ fetchNextPage, hasNextPage: true }),
    );
    renderWithTheme(<TransactionsScreen />);

    fireEvent(screen.getByTestId("transactions-list"), "onEndReached");
    fireEvent(screen.getByTestId("transactions-list"), "onEndReached");

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    await act(async () => finishRequest());
  });

  it("atualiza a primeira página por pull to refresh", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    mockUseTransactions.mockReturnValue(queryResult({ refetch }));
    const view = renderWithTheme(<TransactionsScreen />);

    fireEvent(view.UNSAFE_getByType(RefreshControl), "refresh");

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("exibe skeleton durante o carregamento inicial", () => {
    mockUseTransactions.mockReturnValue(
      queryResult({ data: undefined, isPending: true }),
    );
    renderWithTheme(<TransactionsScreen />);

    expect(screen.getByLabelText("Carregando transações")).toBeOnTheScreen();
  });

  it("exibe o estado vazio", () => {
    mockUseTransactions.mockReturnValue(
      queryResult({ data: { pages: [{ items: [] }], pageParams: [undefined] } }),
    );
    renderWithTheme(<TransactionsScreen />);

    expect(screen.getByText("Você ainda não possui transações.")).toBeOnTheScreen();
  });

  it("exibe erro e permite tentar novamente", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    mockUseTransactions.mockReturnValue(
      queryResult({ data: undefined, isError: true, refetch }),
    );
    renderWithTheme(<TransactionsScreen />);

    expect(
      screen.getByText("Não foi possível carregar suas transações. Verifique sua conexão e tente novamente."),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("mantém a ação acessível de adicionar", () => {
    const onAddTransaction = jest.fn();
    renderWithTheme(<TransactionsScreen onAddTransaction={onAddTransaction} />);

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar transação" }),
    );
    expect(onAddTransaction).toHaveBeenCalledTimes(1);
  });

  it("limita o trabalho inicial e a janela de renderização da FlatList", () => {
    renderWithTheme(<TransactionsScreen />);

    expect(screen.getByTestId("transactions-list")).toHaveProp(
      "initialNumToRender",
      10,
    );
    expect(screen.getByTestId("transactions-list")).toHaveProp(
      "maxToRenderPerBatch",
      10,
    );
    expect(screen.getByTestId("transactions-list")).toHaveProp("windowSize", 7);
  });
});
