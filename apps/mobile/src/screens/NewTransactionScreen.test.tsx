import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert, BackHandler, Platform } from "react-native";

import {
  useCreateTransactionMutation,
  useTransactionCategoriesQuery,
  useTransactionQuery,
  useUpdateTransactionMutation,
} from "@mobile/features/transactions/hooks";
import { renderWithTheme } from "@mobile/test/render";
import { TransactionFormScreen } from "./NewTransactionScreen";

const mockUploadPending = jest.fn();

jest.mock(
  "@mobile/features/transactions/components/MobileAttachmentInput",
  () => {
    const React = jest.requireActual<typeof import("react")>("react");
    return {
      MobileAttachmentInput: React.forwardRef(function MockAttachmentInput(
        _props: unknown,
        ref: React.ForwardedRef<unknown>,
      ) {
        React.useImperativeHandle(ref, () => ({
          hasPending: () => true,
          uploadPending: mockUploadPending,
        }));
        return null;
      }),
    };
  },
);

jest.mock("@mobile/features/transactions/hooks", () => ({
  useCreateTransactionMutation: jest.fn(),
  useTransactionCategoriesQuery: jest.fn(),
  useTransactionQuery: jest.fn(),
  useUpdateTransactionMutation: jest.fn(),
}));

const mockUseCreateMutation = jest.mocked(useCreateTransactionMutation);
const mockUseCategories = jest.mocked(useTransactionCategoriesQuery);
const mockUseTransaction = jest.mocked(useTransactionQuery);
const mockUseUpdateMutation = jest.mocked(useUpdateTransactionMutation);

type MutationMock = {
  error: Error | null;
  isError: boolean;
  isPending: boolean;
  mutateAsync: jest.Mock;
  reset: jest.Mock;
};

const categories = [
  { id: "groceries", name: "Alimentação", type: "expense" as const },
  { id: "salary", name: "Salário", type: "income" as const },
];

const persistedTransaction = {
  id: "tx-1",
  description: "Supermercado",
  observation: "Compra do mês",
  amountInCents: 15_090,
  type: "expense" as const,
  categoryId: "groceries",
  category: "Alimentação",
  date: "2026-09-10",
  status: "pending" as const,
  attachmentCount: 0,
};

let createMutation: MutationMock;
let updateMutation: MutationMock;

function mutationMock(): MutationMock {
  return {
    error: null,
    isError: false,
    isPending: false,
    mutateAsync: jest.fn().mockResolvedValue(persistedTransaction),
    reset: jest.fn(),
  };
}

function queryMock(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as never;
}

beforeEach(() => {
  mockUploadPending.mockReset().mockResolvedValue({ uploaded: [], failed: [] });
  createMutation = mutationMock();
  updateMutation = mutationMock();
  mockUseCreateMutation.mockImplementation(() => createMutation as never);
  mockUseUpdateMutation.mockImplementation(() => updateMutation as never);
  mockUseCategories.mockReturnValue(queryMock({ data: categories }));
  mockUseTransaction.mockReturnValue(queryMock());
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function fillRequiredFields() {
  fireEvent.changeText(
    screen.getByLabelText("Descrição da transação"),
    "Supermercado",
  );
  fireEvent.changeText(
    screen.getByLabelText("Valor da transação em reais"),
    "150,90",
  );
  fireEvent.press(
    screen.getByRole("radio", { name: "Categoria: Alimentação" }),
  );
}

describe("TransactionFormScreen", () => {
  it("mostra as mensagens de validação por campo", async () => {
    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Salvar transação" }));

    expect(
      await screen.findByText("Informe uma descrição com pelo menos 3 caracteres."),
    ).toBeOnTheScreen();
    expect(screen.getByText("Informe o valor da transação.")).toBeOnTheScreen();
    expect(screen.getByText("Selecione uma categoria.")).toBeOnTheScreen();
    expect(createMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("cria, converte vírgula decimal e retorna após salvar", async () => {
    const onSaved = jest.fn();
    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" onSaved={onSaved} />,
    );
    fillRequiredFields();

    fireEvent.press(screen.getByRole("button", { name: "Salvar transação" }));

    await waitFor(() => expect(createMutation.mutateAsync).toHaveBeenCalledWith({
      amountInCents: 15_090,
      category: "Alimentação",
      categoryId: "groceries",
      date: "2026-09-13",
      description: "Supermercado",
      observation: "",
      status: "completed",
      type: "expense",
    }));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Transação criada",
      "Os dados foram salvos com sucesso.",
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("preenche e atualiza uma transação existente", async () => {
    mockUseTransaction.mockReturnValue(
      queryMock({ data: persistedTransaction }),
    );
    const onSaved = jest.fn();
    renderWithTheme(
      <TransactionFormScreen
        maximumDate="2026-09-13"
        mode="edit"
        onSaved={onSaved}
        transactionId="tx-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Descrição da transação")).toHaveProp(
        "value",
        "Supermercado",
      );
    });
    expect(screen.getByLabelText("Valor da transação em reais")).toHaveProp(
      "value",
      "150,90",
    );
    expect(screen.getByLabelText("Observação da transação")).toHaveProp(
      "value",
      "Compra do mês",
    );

    fireEvent.changeText(
      screen.getByLabelText("Descrição da transação"),
      "Supermercado atualizado",
    );
    fireEvent.press(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: "tx-1",
      input: expect.objectContaining({
        amountInCents: 15_090,
        category: "Alimentação",
        description: "Supermercado atualizado",
        status: "pending",
      }),
    }));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("exibe o erro devolvido pela persistência", () => {
    createMutation.isError = true;
    createMutation.error = new Error("Serviço temporariamente indisponível.");

    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" />,
    );

    expect(
      screen.getByText("Serviço temporariamente indisponível."),
    ).toBeOnTheScreen();
  });

  it("impede envio duplicado enquanto a primeira mutation está pendente", async () => {
    let resolveMutation: (value: typeof persistedTransaction) => void = () => undefined;
    createMutation.mutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );
    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" />,
    );
    fillRequiredFields();
    const saveButton = screen.getByRole("button", { name: "Salvar transação" });

    fireEvent.press(saveButton);
    fireEvent.press(saveButton);

    await waitFor(() => expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1));
    await act(async () => resolveMutation(persistedTransaction));
  });

  it("confirma antes de abandonar um formulário alterado", () => {
    const onBack = jest.fn();
    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" onBack={onBack} />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Descrição da transação"),
      "Alteração",
    );

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Descartar alterações?",
      "As informações preenchidas não serão salvas.",
      expect.any(Array),
    );
    expect(onBack).not.toHaveBeenCalled();
  });

  it("não registra BackHandler na versão web", () => {
    jest.replaceProperty(Platform, "OS", "web");
    const backHandlerSpy = jest.spyOn(BackHandler, "addEventListener");

    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" />,
    );

    expect(backHandlerSpy).not.toHaveBeenCalled();
  });

  it("explica a ausência de categorias e impede um envio impossível", () => {
    mockUseCategories.mockReturnValue(queryMock({ data: [] }));

    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" />,
    );

    expect(
      screen.getByText(
        "Nenhuma categoria cadastrada para este tipo. Carregue os dados iniciais e tente novamente.",
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Salvar transação" }),
    ).toBeDisabled();
  });

  it("mantém o ponto de extensão de anexos sem iniciar upload", () => {
    const extension = jest.fn(() => null);
    renderWithTheme(
      <TransactionFormScreen
        maximumDate="2026-09-13"
        renderAttachmentsExtension={extension}
      />,
    );

    expect(extension).toHaveBeenCalledWith({
      disabled: false,
      transactionId: undefined,
    });
  });

  it("não recria a transação ao concluir novamente depois de upload parcial", async () => {
    const onSaved = jest.fn();
    mockUploadPending
      .mockResolvedValueOnce({
        uploaded: [{ id: "attachment-1" }],
        failed: [
          { attachmentId: "attachment-2", name: "falhou.pdf", message: "Falhou" },
        ],
      })
      .mockResolvedValueOnce({ uploaded: [{ id: "attachment-2" }], failed: [] });

    renderWithTheme(
      <TransactionFormScreen maximumDate="2026-09-13" onSaved={onSaved} />,
    );
    fillRequiredFields();

    fireEvent.press(screen.getByRole("button", { name: "Salvar transação" }));

    await waitFor(() => expect(mockUploadPending).toHaveBeenCalledWith("tx-1"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Transação salva parcialmente",
      expect.stringContaining("1 comprovante(s) enviado(s) e 1 com falha"),
    );
    expect(onSaved).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole("button", { name: "Salvar transação" }));

    await waitFor(() => expect(mockUploadPending).toHaveBeenCalledTimes(2));
    expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: "tx-1",
      input: expect.objectContaining({ description: "Supermercado" }),
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
