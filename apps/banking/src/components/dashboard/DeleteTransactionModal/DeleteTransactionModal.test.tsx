import { fireEvent, render, screen } from "@testing-library/react";
import type { TransactionViewModel } from "@banking/shared/types";
import { DeleteTransactionModal } from ".";

const transaction: TransactionViewModel = {
  id: "transaction-1",
  description: "Pagamento",
  observation: "",
  attachmentCount: 0,
  amount: -100,
  formattedAmount: "-R$ 100,00",
  type: "expense",
  typeLabel: "Saída",
  category: "Pagamento",
  date: "2026-07-23",
  formattedDate: "23/07/2026",
  status: "completed",
  statusLabel: "Concluída",
  editableFields: {
    description: "Pagamento",
    observation: "",
    amount: 100,
    type: "expense",
    category: "Pagamento",
    date: "2026-07-23",
    status: "completed",
  },
};

describe("DeleteTransactionModal", () => {
  it("solicita a exclusão sem fechar antes da mutation concluir", () => {
    const onConfirm = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <DeleteTransactionModal
        open
        transaction={transaction}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("mantém o erro visível e bloqueia ações durante o envio", () => {
    render(
      <DeleteTransactionModal
        open
        transaction={transaction}
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
        errorMessage="Não foi possível excluir a transação."
        isSubmitting
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível excluir a transação.",
    );
    expect(screen.getByRole("button", { name: "Excluir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
