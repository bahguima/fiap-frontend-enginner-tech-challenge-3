import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  TransactionCategory,
  TransactionViewModel,
} from "@banking/shared/types";
import type { TransactionSubmissionResult } from "@dashboard/features/transactions/types";
import { TransactionFormModal } from ".";
import type { ITransactionFormModalProps } from "./interface";

const categories: TransactionCategory[] = [
  { id: "category-1", name: "Depósito", type: "income" },
  { id: "category-2", name: "Transferência", type: "both" },
  { id: "category-3", name: "Pagamento", type: "expense" },
];

const savedTransaction: TransactionViewModel = {
  id: "transaction-101",
  description: "Pagamento teste",
  observation: "",
  attachmentCount: 0,
  amount: 125.5,
  formattedAmount: "+R$ 125,50",
  type: "income",
  typeLabel: "Entrada",
  category: "Depósito",
  date: "2026-07-25",
  formattedDate: "25/07/2026",
  status: "completed",
  statusLabel: "Concluída",
  editableFields: {
    description: "Pagamento teste",
    observation: "",
    amount: 125.5,
    type: "income",
    category: "Depósito",
    date: "2026-07-25",
    status: "completed",
  },
};

const successfulResult: TransactionSubmissionResult = {
  transaction: savedTransaction,
  uploadedAttachments: [],
  failedAttachments: [],
};

function createProps(
  overrides: Partial<ITransactionFormModalProps> = {},
): ITransactionFormModalProps {
  return {
    mode: "create",
    open: true,
    categories,
    existingAttachments: [],
    isCategoriesError: false,
    isCategoriesLoading: false,
    isExistingAttachmentsError: false,
    isExistingAttachmentsLoading: false,
    isRemovingAttachment: false,
    onOpenChange: jest.fn(),
    onRemoveExistingAttachment: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(successfulResult),
    ...overrides,
  };
}

describe("TransactionFormModal", () => {
  it("renderiza os campos avançados e as categorias recebidas da API", async () => {
    render(<TransactionFormModal {...createProps()} />);

    expect(
      screen.getByRole("heading", { name: "Nova Transação" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor")).toBeInTheDocument();
    expect(screen.getByLabelText("Observação")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Selecione os comprovantes"),
    ).toHaveAttribute("accept", ".pdf,.jpg,.jpeg,.png");

    expect(
      screen.getByRole("option", {
        name: "Transferência",
        hidden: true,
      }),
    ).toBeInTheDocument();
  });

  it("envia os dados válidos e o arquivo multipart selecionado", async () => {
    const onOpenChange = jest.fn();
    const onSubmit = jest.fn().mockResolvedValue(successfulResult);
    const file = new File(["recibo"], "recibo.pdf", {
      type: "application/pdf",
    });

    render(
      <TransactionFormModal
        {...createProps({ onOpenChange, onSubmit })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Pagamento teste" },
    });
    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "125.5" },
    });
    fireEvent.change(screen.getByLabelText("Observação"), {
      target: { value: "Comprovante da operação" },
    });
    fireEvent.change(screen.getByLabelText("Selecione os comprovantes"), {
      target: { files: [file] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar transação" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 125.5,
          description: "Pagamento teste",
          observation: "Comprovante da operação",
          category: "Depósito",
        }),
        [file],
        null,
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("preenche a edição com observação e anexos existentes", () => {
    render(
      <TransactionFormModal
        {...createProps({
          mode: "edit",
          transaction: savedTransaction,
          existingAttachments: [
            {
              id: "attachment-1",
              transactionId: savedTransaction.id,
              fileName: "comprovante.pdf",
              contentType: "application/pdf",
              size: 2048,
              formattedSize: "2 KB",
              uploadedAt: "2026-07-25T12:00:00.000Z",
              downloadUrl: "/api/attachments/attachment-1/content",
            },
          ],
        })}
      />,
    );

    expect(screen.getByLabelText("Descrição")).toHaveValue(
      "Pagamento teste",
    );
    expect(screen.getByLabelText("Observação")).toHaveValue("");
    expect(
      screen.getByRole("list", { name: "Anexos existentes" }),
    ).toHaveTextContent("comprovante.pdf");
    expect(
      screen.getByRole("button", {
        name: "Remover anexo comprovante.pdf",
      }),
    ).toBeInTheDocument();
  });

  it("valida quantidade, tamanho e MIME type dos anexos", async () => {
    const files = [
      new File(["1"], "um.pdf", { type: "application/pdf" }),
      new File(["2"], "dois.pdf", { type: "application/pdf" }),
      new File(["3"], "tres.pdf", { type: "application/pdf" }),
      new File(["4"], "quatro.pdf", { type: "application/pdf" }),
      new File(["5"], "cinco.pdf", { type: "application/pdf" }),
      new File(["6"], "seis.pdf", { type: "application/pdf" }),
    ];

    render(<TransactionFormModal {...createProps()} />);
    fireEvent.change(screen.getByLabelText("Selecione os comprovantes"), {
      target: { files },
    });

    expect(
      await screen.findByText(
        "Cada transação pode ter no máximo 5 anexos.",
      ),
    ).toBeInTheDocument();

    const invalidFile = new File(["planilha"], "dados.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText("Selecione os comprovantes"), {
      target: { files: [invalidFile] },
    });
    expect(
      await screen.findByText("Envie apenas arquivos PDF, JPEG ou PNG."),
    ).toBeInTheDocument();

    const oversizedFile = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "grande.pdf",
      { type: "application/pdf" },
    );
    fireEvent.change(screen.getByLabelText("Selecione os comprovantes"), {
      target: { files: [oversizedFile] },
    });
    expect(
      await screen.findByText("Cada arquivo deve ter no máximo 5 MB."),
    ).toBeInTheDocument();
  });

  it("mantém a transação salva e reenvia somente o anexo que falhou", async () => {
    const file = new File(["recibo"], "recibo.pdf", {
      type: "application/pdf",
    });
    const partialResult: TransactionSubmissionResult = {
      transaction: savedTransaction,
      uploadedAttachments: [],
      failedAttachments: [
        {
          file,
          message: "Falha temporária no upload.",
        },
      ],
    };
    const onSubmit = jest
      .fn()
      .mockResolvedValueOnce(partialResult)
      .mockResolvedValueOnce(successfulResult);

    render(<TransactionFormModal {...createProps({ onSubmit })} />);
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Pagamento teste" },
    });
    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "125.5" },
    });
    fireEvent.change(screen.getByLabelText("Selecione os comprovantes"), {
      target: { files: [file] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar transação" }),
    );

    expect(
      await screen.findByText(/A transação foi salva, mas alguns anexos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("recibo.pdf: Falha temporária no upload."),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Reenviar anexos" }),
    );
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ description: "Pagamento teste" }),
        [file],
        savedTransaction,
      );
    });
  });

  it("exibe erro da mutation e bloqueia ações durante o envio", () => {
    render(
      <TransactionFormModal
        {...createProps({
          errorMessage: "Não foi possível criar a transação.",
          isSubmitting: true,
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível criar a transação.",
    );
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
