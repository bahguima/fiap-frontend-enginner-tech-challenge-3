import type { Transaction, TransactionCategory } from "@banking/shared/types";
import {
  getCalendarDateValue,
  isCalendarDateOnOrBefore,
  isValidCalendarDate,
  MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS,
} from "@banking/shared/domain";
import {
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";

import { TransactionsRepositoryError } from "./transactionErrors";
import type { TransactionInput } from "../types/transactions";

const MAXIMUM_ATTACHMENT_COUNT = 5;

export interface TransactionFirestoreDocument {
  description: string;
  descriptionNormalized: string;
  observation: string;
  amountInCents: number;
  incomeAmountInCents: number;
  expenseAmountInCents: number;
  type: Transaction["type"];
  categoryId: string;
  categoryName: string;
  occurredOn: string;
  status: Transaction["status"];
  attachmentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: 1;
}

export type TransactionFirestoreWrite = Omit<
  TransactionFirestoreDocument,
  "createdAt" | "updatedAt"
> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

export interface TransactionCategoryFirestoreDocument {
  name: string;
  type: TransactionCategory["type"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  field: string,
  options?: { allowEmpty?: boolean },
): string {
  if (typeof value !== "string" || (!options?.allowEmpty && !value.trim())) {
    throw invalidData(field);
  }

  return value;
}

function requireInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw invalidData(field);
  }

  return value;
}

function invalidData(field: string): TransactionsRepositoryError {
  return new TransactionsRepositoryError("invalid-data", "read", {
    message: `O campo persistido "${field}" é inválido.`,
  });
}

function assertTransactionInput(input: TransactionInput): TransactionInput {
  if (input.description.trim().length < 3 || input.description.trim().length > 120) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }
  if (input.observation.length > 500) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }
  if (
    !Number.isSafeInteger(input.amountInCents) ||
    input.amountInCents <= 0 ||
    input.amountInCents > MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS
  ) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }
  if (input.type !== "income" && input.type !== "expense") {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }
  if (!input.categoryId.trim() || !input.category.trim()) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }
  if (!isCalendarDateOnOrBefore(input.date, getCalendarDateValue(new Date()))) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }
  if (
    input.status !== "completed" &&
    input.status !== "pending" &&
    input.status !== "failed"
  ) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }

  return input;
}

export function normalizeTransactionDescription(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function transactionToFirestore(
  input: TransactionInput,
  attachmentCount = 0,
): TransactionFirestoreWrite {
  const validInput = assertTransactionInput(input);

  if (
    !Number.isInteger(attachmentCount) ||
    attachmentCount < 0 ||
    attachmentCount > MAXIMUM_ATTACHMENT_COUNT
  ) {
    throw new TransactionsRepositoryError("invalid-argument", "create");
  }

  return {
    description: validInput.description.trim(),
    descriptionNormalized: normalizeTransactionDescription(
      validInput.description,
    ),
    observation: validInput.observation.trim(),
    amountInCents: validInput.amountInCents,
    incomeAmountInCents:
      validInput.type === "income" ? validInput.amountInCents : 0,
    expenseAmountInCents:
      validInput.type === "expense" ? validInput.amountInCents : 0,
    type: validInput.type,
    categoryId: validInput.categoryId.trim(),
    categoryName: validInput.category.trim(),
    occurredOn: validInput.date,
    status: validInput.status,
    attachmentCount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
  };
}

export function transactionUpdateToFirestore(
  input: TransactionInput,
): Omit<TransactionFirestoreWrite, "createdAt" | "attachmentCount"> {
  const { createdAt: _createdAt, attachmentCount: _attachmentCount, ...fields } =
    transactionToFirestore(input);

  return fields;
}

export function transactionFromFirestore(
  id: string,
  value: unknown,
): Transaction {
  if (!id.trim() || !isRecord(value)) throw invalidData("document");

  const description = requireString(value.description, "description");
  const observation = requireString(value.observation, "observation", {
    allowEmpty: true,
  });
  const amountInCents = requireInteger(value.amountInCents, "amountInCents");
  const categoryId = requireString(value.categoryId, "categoryId");
  const category = requireString(value.categoryName, "categoryName");
  const date = requireString(value.occurredOn, "occurredOn");
  const attachmentCount = requireInteger(
    value.attachmentCount,
    "attachmentCount",
  );
  const incomeAmountInCents = requireInteger(
    value.incomeAmountInCents,
    "incomeAmountInCents",
  );
  const expenseAmountInCents = requireInteger(
    value.expenseAmountInCents,
    "expenseAmountInCents",
  );
  const descriptionNormalized = requireString(
    value.descriptionNormalized,
    "descriptionNormalized",
  );

  if (
    amountInCents <= 0 ||
    description.length > 120 ||
    observation.length > 500 ||
    descriptionNormalized !== normalizeTransactionDescription(description)
  ) {
    throw invalidData(
      descriptionNormalized !== normalizeTransactionDescription(description)
        ? "descriptionNormalized"
        : observation.length > 500
          ? "observation"
          : description.length > 120
            ? "description"
            : "amountInCents",
    );
  }
  if (value.type !== "income" && value.type !== "expense") {
    throw invalidData("type");
  }
  if (
    (value.type === "income" &&
      (incomeAmountInCents !== amountInCents || expenseAmountInCents !== 0)) ||
    (value.type === "expense" &&
      (incomeAmountInCents !== 0 || expenseAmountInCents !== amountInCents))
  ) {
    throw invalidData("amountInCents");
  }
  if (
    value.status !== "completed" &&
    value.status !== "pending" &&
    value.status !== "failed"
  ) {
    throw invalidData("status");
  }
  if (!isValidCalendarDate(date)) throw invalidData("occurredOn");
  if (
    attachmentCount < 0 ||
    attachmentCount > MAXIMUM_ATTACHMENT_COUNT ||
    value.schemaVersion !== 1
  ) {
    throw invalidData(
      value.schemaVersion !== 1 ? "schemaVersion" : "attachmentCount",
    );
  }

  return {
    id,
    description,
    observation,
    amountInCents,
    type: value.type,
    categoryId,
    category,
    date,
    status: value.status,
    attachmentCount,
  };
}

export function transactionCategoryFromFirestore(
  id: string,
  value: unknown,
): TransactionCategory {
  if (!id.trim() || !isRecord(value)) throw invalidData("category");

  const name = requireString(value.name, "name");
  if (
    value.type !== "income" &&
    value.type !== "expense" &&
    value.type !== "both"
  ) {
    throw invalidData("type");
  }

  return { id, name, type: value.type };
}
