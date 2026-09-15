import {
  createTransactionFormSchema,
  createTransactionSchema,
  MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS,
} from "./transactions";

const validTransaction = {
  id: "transaction-1",
  description: "Compra no mercado",
  observation: "",
  amountInCents: 42743,
  type: "expense" as const,
  categoryId: "category-1",
  category: "Pagamento",
  date: "2026-09-12",
  status: "completed" as const,
  attachmentCount: 0,
};

describe("validação de transação", () => {
  it("aceita o modelo de domínio com amountInCents inteiro", () => {
    expect(createTransactionSchema("2026-09-13").safeParse(validTransaction).success).toBe(true);
  });

  it("rejeita centavos fracionários e campos fora dos limites", () => {
    const result = createTransactionSchema("2026-09-13").safeParse({
      ...validTransaction,
      description: "x",
      amountInCents: 10.5,
    });
    expect(result.success).toBe(false);
  });

  it("valida os campos e converte vírgula decimal para amountInCents", () => {
    const result = createTransactionFormSchema("2026-09-13").safeParse({
      description: "Supermercado",
      amount: "1.234,56",
      type: "expense",
      categoryId: "groceries",
      date: "2026-09-13",
      status: "completed",
      observation: "Compra do mês",
    });

    expect(result).toEqual({
      success: true,
      data: {
        description: "Supermercado",
        amountInCents: 123_456,
        type: "expense",
        categoryId: "groceries",
        date: "2026-09-13",
        status: "completed",
        observation: "Compra do mês",
      },
    });
  });

  it.each([
    ["ab", "1,00", "", "2026-09-13", "descrição e categoria"],
    ["Compra", "0,00", "food", "2026-09-13", "valor mínimo"],
    ["Compra", "12,345", "food", "2026-09-13", "casas decimais"],
    ["Compra", "1,00", "food", "2026-09-14", "data futura"],
    ["Compra", "1,00", "food", "2026-02-30", "data inválida"],
  ])("rejeita %s / %s por %s", (description, amount, categoryId, date) => {
    expect(createTransactionFormSchema("2026-09-13").safeParse({
      description,
      amount,
      type: "expense",
      categoryId,
      date,
      status: "completed",
      observation: "",
    }).success).toBe(false);
  });

  it("respeita o valor máximo do domínio e o limite da observação", () => {
    const schema = createTransactionFormSchema("2026-09-13");
    const base = {
      description: "Compra",
      type: "expense" as const,
      categoryId: "food",
      date: "2026-09-13",
      status: "completed" as const,
    };

    expect(schema.safeParse({
      ...base,
      amount: ((MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS + 1) / 100).toFixed(2),
      observation: "",
    }).success).toBe(false);
    expect(schema.safeParse({
      ...base,
      amount: "1,00",
      observation: "x".repeat(501),
    }).success).toBe(false);
  });
});
