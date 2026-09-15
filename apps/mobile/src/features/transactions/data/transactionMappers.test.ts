import { Timestamp } from "firebase/firestore";

import {
  normalizeTransactionDescription,
  transactionCategoryFromFirestore,
  transactionFromFirestore,
  transactionToFirestore,
  transactionUpdateToFirestore,
} from "./transactionMappers";
import { TransactionsRepositoryError } from "./transactionErrors";
import type { TransactionInput } from "../types/transactions";

const input: TransactionInput = {
  description: "  Aluguel de Setembro  ",
  observation: "  Pago por Pix  ",
  amountInCents: 189_990,
  type: "expense",
  categoryId: "housing",
  category: "Moradia",
  date: "2026-09-10",
  status: "completed",
};

describe("transaction Firestore mappers", () => {
  it("normalizes descriptions and writes all derived persistence fields", () => {
    expect(normalizeTransactionDescription("  AÇÃO   e Café ")).toBe(
      "acao e cafe",
    );

    expect(transactionToFirestore(input)).toMatchObject({
      description: "Aluguel de Setembro",
      descriptionNormalized: "aluguel de setembro",
      observation: "Pago por Pix",
      amountInCents: 189_990,
      incomeAmountInCents: 0,
      expenseAmountInCents: 189_990,
      type: "expense",
      categoryId: "housing",
      categoryName: "Moradia",
      occurredOn: "2026-09-10",
      status: "completed",
      attachmentCount: 0,
      schemaVersion: 1,
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    });
  });

  it("does not overwrite creation time or attachment count on update", () => {
    const update = transactionUpdateToFirestore(input);

    expect(update).not.toHaveProperty("createdAt");
    expect(update).not.toHaveProperty("attachmentCount");
    expect(update).toHaveProperty("updatedAt");
  });

  it("converts a valid Firestore document to the domain model", () => {
    const now = Timestamp.fromMillis(1_789_000_000_000);

    expect(
      transactionFromFirestore("tx-1", {
        ...transactionToFirestore(input),
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: "tx-1",
      description: "Aluguel de Setembro",
      observation: "Pago por Pix",
      amountInCents: 189_990,
      type: "expense",
      categoryId: "housing",
      category: "Moradia",
      date: "2026-09-10",
      status: "completed",
      attachmentCount: 0,
    });
  });

  it("rejects corrupted persisted data with a standardized error", () => {
    try {
      transactionFromFirestore("tx-1", {
        ...transactionToFirestore(input),
        amountInCents: 1.5,
      });
      throw new Error("Expected mapper to reject corrupted data.");
    } catch (error) {
      expect(error).toBeInstanceOf(TransactionsRepositoryError);
      expect(error).toMatchObject({ code: "invalid-data", operation: "read" });
    }
  });

  it("converts a transaction category document", () => {
    expect(
      transactionCategoryFromFirestore("housing", {
        name: "Moradia",
        type: "expense",
      }),
    ).toEqual({ id: "housing", name: "Moradia", type: "expense" });
  });
});
