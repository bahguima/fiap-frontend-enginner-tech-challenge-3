import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import {
  useDeleteTransactionMutation,
  useTransactionQuery,
} from "@mobile/features/transactions/hooks";
import { renderWithTheme } from "@mobile/test/render";
import { TransactionDetailsScreen } from "./TransactionDetailsScreen";

jest.mock("@mobile/features/transactions/hooks", () => ({
  useDeleteTransactionMutation: jest.fn(),
  useTransactionQuery: jest.fn(),
}));

const mockUseTransaction = jest.mocked(useTransactionQuery);
const mockUseDelete = jest.mocked(useDeleteTransactionMutation);
const transaction = {
  id: "tx-1",
  description: "Supermercado",
  observation: "Compra mensal",
  amountInCents: 28_590,
  type: "expense" as const,
  categoryId: "groceries",
  category: "Alimentação",
  date: "2026-09-08",
  status: "completed" as const,
  attachmentCount: 0,
};

function queryResult(data = transaction) {
  return {
    data,
    isError: false,
    isPending: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useTransactionQuery>;
}

function deleteResult(overrides: Record<string, unknown> = {}) {
  return {
    error: null,
    isError: false,
    isPending: false,
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useDeleteTransactionMutation>;
}

beforeEach(() => {
  mockUseTransaction.mockReturnValue(queryResult());
  mockUseDelete.mockReturnValue(deleteResult());
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe("TransactionDetailsScreen", () => {
  it("confirma, exclui e retorna para a listagem", async () => {
    const mutation = deleteResult();
    const onDeleted = jest.fn();
    mockUseDelete.mockReturnValue(mutation);
    renderWithTheme(
      <TransactionDetailsScreen
        id="tx-1"
        onBack={jest.fn()}
        onDeleted={onDeleted}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Excluir transação" }));
    const confirmation = jest.mocked(Alert.alert).mock.calls[0]?.[2];
    const destructiveAction = confirmation?.find(
      (button) => button.style === "destructive",
    );
    await act(async () => destructiveAction?.onPress?.());

    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledWith("tx-1"));
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenLastCalledWith(
      "Transação excluída",
      "A transação foi removida com sucesso.",
    );
  });

  it("orienta a remoção dos anexos antes de excluir", () => {
    const mutation = deleteResult();
    const onEdit = jest.fn();
    mockUseTransaction.mockReturnValue(
      queryResult({ ...transaction, attachmentCount: 1 }),
    );
    mockUseDelete.mockReturnValue(mutation);
    renderWithTheme(
      <TransactionDetailsScreen id="tx-1" onBack={jest.fn()} onEdit={onEdit} />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Excluir transação" }));

    expect(mutation.mutateAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Remova os comprovantes",
      expect.stringContaining("remova todos os comprovantes"),
      expect.any(Array),
    );
    const actions = jest.mocked(Alert.alert).mock.calls[0]?.[2];
    actions?.find((button) => button.text === "Editar transação")?.onPress?.();
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("mantém o erro de exclusão visível e acessível", () => {
    mockUseDelete.mockReturnValue(
      deleteResult({
        error: new Error("Serviço temporariamente indisponível."),
        isError: true,
      }),
    );
    renderWithTheme(
      <TransactionDetailsScreen id="tx-1" onBack={jest.fn()} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Serviço temporariamente indisponível.",
    );
  });
});
