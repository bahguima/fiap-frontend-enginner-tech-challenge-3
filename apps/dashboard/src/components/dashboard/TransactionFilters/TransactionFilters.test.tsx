import { fireEvent, render, screen } from "@testing-library/react";
import type { TransactionCategory } from "@banking/shared/types";

import { TransactionFilters } from ".";

const categories: TransactionCategory[] = [
  { id: "category-1", name: "Depósito", type: "income" },
  { id: "category-2", name: "Transferência", type: "both" },
];

describe("TransactionFilters", () => {
  it("expõe controles semânticos acessíveis por teclado", () => {
    render(
      <TransactionFilters
        categories={categories}
        filters={{ pageSize: 10, sort: "date-desc" }}
        onClear={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("form", { name: "Filtros de transações" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Buscar por texto" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Tipo" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Categoria" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    ).toBeInTheDocument();
  });

  it("envia todos os filtros avançados preenchidos", () => {
    const handleSubmit = jest.fn();

    render(
      <TransactionFilters
        categories={categories}
        filters={{ pageSize: 10, sort: "date-desc" }}
        onClear={jest.fn()}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar por texto" }),
      { target: { value: "Projeto" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), {
      target: { value: "income" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), {
      target: { value: "Transferência" },
    });
    fireEvent.change(screen.getByLabelText("De"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText("Até"), {
      target: { value: "2026-04-30" },
    });
    fireEvent.change(screen.getByLabelText("Valor mínimo"), {
      target: { value: "2000" },
    });
    fireEvent.change(screen.getByLabelText("Valor máximo"), {
      target: { value: "3000" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar por" }), {
      target: { value: "amount-desc" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Itens por página" }),
      { target: { value: "5" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    );

    expect(handleSubmit).toHaveBeenCalledWith({
      search: "Projeto",
      type: "income",
      category: "Transferência",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      minimumAmount: 2000,
      maximumAmount: 3000,
      sort: "amount-desc",
      pageSize: 5,
    });
  });

  it("emite os valores brutos a cada alteração para o stream de filtros", () => {
    const handleChange = jest.fn();

    render(
      <TransactionFilters
        categories={categories}
        filters={{ pageSize: 10, sort: "date-desc" }}
        onChange={handleChange}
        onClear={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar por texto" }),
      { target: { value: "mer" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), {
      target: { value: "expense" },
    });

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "mer", type: "expense" }),
    );
  });

  it("permite limpar os filtros sem submeter o formulário", () => {
    const handleClear = jest.fn();
    const handleSubmit = jest.fn();

    render(
      <TransactionFilters
        categories={categories}
        filters={{ search: "mercado", pageSize: 5 }}
        onClear={handleClear}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    );

    expect(handleClear).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
