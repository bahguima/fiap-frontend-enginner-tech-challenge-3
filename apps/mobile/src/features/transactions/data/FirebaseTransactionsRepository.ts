import type { Transaction, TransactionSort } from "@banking/shared/types";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { isValidCalendarDate } from "@banking/shared/domain";
import { getFirebaseServices } from "@mobile/services/firebase";
import type {
  TransactionCursor,
  TransactionFilters,
  TransactionInput,
  TransactionPage,
  TransactionsRepository,
} from "../types/transactions";
import {
  TransactionsRepositoryError,
  requireAuthenticatedUid,
  toTransactionsRepositoryError,
  type TransactionsRepositoryOperation,
} from "./transactionErrors";
import {
  transactionCategoryFromFirestore,
  transactionFromFirestore,
  transactionToFirestore,
  transactionUpdateToFirestore,
} from "./transactionMappers";

const DEFAULT_PAGE_SIZE = 20;
const MAXIMUM_PAGE_SIZE = 50;

interface SortPlan {
  direction: "asc" | "desc";
  field: "occurredOn" | "amountInCents" | "descriptionNormalized";
}

const SORT_PLANS: Record<TransactionSort, SortPlan> = {
  "date-desc": { field: "occurredOn", direction: "desc" },
  "date-asc": { field: "occurredOn", direction: "asc" },
  "amount-desc": { field: "amountInCents", direction: "desc" },
  "amount-asc": { field: "amountInCents", direction: "asc" },
  "description-desc": {
    field: "descriptionNormalized",
    direction: "desc",
  },
  "description-asc": {
    field: "descriptionNormalized",
    direction: "asc",
  },
};

function transactionCollection(firestore: Firestore, uid: string) {
  return collection(firestore, "users", uid, "transactions");
}

function validateIdentifier(value: string, operation: TransactionsRepositoryOperation) {
  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue.includes("/")) {
    throw new TransactionsRepositoryError("invalid-argument", operation);
  }
  return normalizedValue;
}

function validateFilters(filters: TransactionFilters): Required<
  Pick<TransactionFilters, "pageSize" | "sort">
> &
  TransactionFilters {
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = filters.sort ?? "date-desc";

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAXIMUM_PAGE_SIZE ||
    !Object.prototype.hasOwnProperty.call(SORT_PLANS, sort) ||
    (filters.type !== undefined &&
      filters.type !== "income" &&
      filters.type !== "expense") ||
    (filters.status !== undefined &&
      filters.status !== "completed" &&
      filters.status !== "pending" &&
      filters.status !== "failed") ||
    (filters.categoryId !== undefined && !filters.categoryId.trim()) ||
    (filters.startDate !== undefined &&
      !isValidCalendarDate(filters.startDate)) ||
    (filters.endDate !== undefined && !isValidCalendarDate(filters.endDate)) ||
    (filters.startDate !== undefined &&
      filters.endDate !== undefined &&
      filters.startDate > filters.endDate) ||
    ((filters.startDate !== undefined || filters.endDate !== undefined) &&
      !sort.startsWith("date-"))
  ) {
    throw new TransactionsRepositoryError("invalid-argument", "list");
  }

  return { ...filters, pageSize, sort };
}

function timestampMillis(value: unknown): number {
  if (
    typeof value !== "object" ||
    value === null ||
    !("toMillis" in value) ||
    typeof (value as { toMillis?: unknown }).toMillis !== "function"
  ) {
    throw new TransactionsRepositoryError("invalid-data", "list", {
      message: "O campo persistido \"createdAt\" é inválido.",
    });
  }

  return (value as { toMillis(): number }).toMillis();
}

function orderValue(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  field: SortPlan["field"],
): string | number {
  const value = snapshot.get(field);

  if (
    (field === "amountInCents" && typeof value !== "number") ||
    (field !== "amountInCents" && typeof value !== "string")
  ) {
    throw new TransactionsRepositoryError("invalid-data", "list", {
      message: `O campo persistido "${field}" é inválido.`,
    });
  }

  return value;
}

function createCursor(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  sortPlan: SortPlan,
): TransactionCursor {
  return {
    orderValue: orderValue(snapshot, sortPlan.field),
    createdAtMillis: timestampMillis(snapshot.get("createdAt")),
    id: snapshot.id,
  };
}

function cursorConstraints(
  cursor: TransactionCursor | undefined,
  sortPlan: SortPlan,
): QueryConstraint[] {
  if (!cursor) return [];

  if (
    !cursor.id.trim() ||
    cursor.id.includes("/") ||
    !Number.isFinite(cursor.createdAtMillis) ||
    (sortPlan.field === "amountInCents"
      ? typeof cursor.orderValue !== "number"
      : typeof cursor.orderValue !== "string")
  ) {
    throw new TransactionsRepositoryError("invalid-argument", "list");
  }

  return [
    startAfter(
      cursor.orderValue,
      Timestamp.fromMillis(cursor.createdAtMillis),
      cursor.id,
    ),
  ];
}

export class FirebaseTransactionsRepository implements TransactionsRepository {
  constructor(private readonly firestore: Firestore) {}

  async create(uid: string, input: TransactionInput): Promise<Transaction> {
    try {
      const ownerUid = requireAuthenticatedUid(uid, "create");
      const reference = await addDoc(
        transactionCollection(this.firestore, ownerUid),
        transactionToFirestore(input),
      );

      return { id: reference.id, ...input, attachmentCount: 0 };
    } catch (error) {
      throw toTransactionsRepositoryError(error, "create");
    }
  }

  async getById(uid: string, id: string): Promise<Transaction> {
    try {
      const ownerUid = requireAuthenticatedUid(uid, "read");
      const transactionId = validateIdentifier(id, "read");
      const snapshot = await getDoc(
        doc(transactionCollection(this.firestore, ownerUid), transactionId),
      );

      if (!snapshot.exists()) {
        throw new TransactionsRepositoryError("not-found", "read");
      }

      return transactionFromFirestore(snapshot.id, snapshot.data());
    } catch (error) {
      throw toTransactionsRepositoryError(error, "read");
    }
  }

  async update(
    uid: string,
    id: string,
    input: TransactionInput,
  ): Promise<Transaction> {
    try {
      const ownerUid = requireAuthenticatedUid(uid, "update");
      const transactionId = validateIdentifier(id, "update");
      const reference = doc(
        transactionCollection(this.firestore, ownerUid),
        transactionId,
      );
      const currentSnapshot = await getDoc(reference);

      if (!currentSnapshot.exists()) {
        throw new TransactionsRepositoryError("not-found", "update");
      }

      const current = transactionFromFirestore(
        currentSnapshot.id,
        currentSnapshot.data(),
      );
      await updateDoc(reference, transactionUpdateToFirestore(input));

      return {
        id: transactionId,
        ...input,
        attachmentCount: current.attachmentCount,
      };
    } catch (error) {
      throw toTransactionsRepositoryError(error, "update");
    }
  }

  async delete(uid: string, id: string): Promise<void> {
    try {
      const ownerUid = requireAuthenticatedUid(uid, "delete");
      const transactionId = validateIdentifier(id, "delete");
      const reference = doc(
        transactionCollection(this.firestore, ownerUid),
        transactionId,
      );
      await runTransaction(this.firestore, async (transaction) => {
        const snapshot = await transaction.get(reference);

        if (!snapshot.exists()) {
          throw new TransactionsRepositoryError("not-found", "delete");
        }

        const current = transactionFromFirestore(snapshot.id, snapshot.data());
        if (current.attachmentCount > 0) {
          throw new TransactionsRepositoryError("conflict", "delete", {
            message: "Remova todos os comprovantes antes de excluir a transação.",
          });
        }

        transaction.delete(reference);
      });
    } catch (error) {
      throw toTransactionsRepositoryError(error, "delete");
    }
  }

  async list(
    uid: string,
    filters: TransactionFilters,
    cursor?: TransactionCursor,
  ): Promise<TransactionPage> {
    try {
      const ownerUid = requireAuthenticatedUid(uid, "list");
      const validFilters = validateFilters(filters);
      const sortPlan = SORT_PLANS[validFilters.sort];
      const constraints: QueryConstraint[] = [];

      if (validFilters.type) {
        constraints.push(where("type", "==", validFilters.type));
      }
      if (validFilters.categoryId?.trim()) {
        constraints.push(
          where("categoryId", "==", validFilters.categoryId.trim()),
        );
      }
      if (validFilters.status) {
        constraints.push(where("status", "==", validFilters.status));
      }
      if (validFilters.startDate) {
        constraints.push(where("occurredOn", ">=", validFilters.startDate));
      }
      if (validFilters.endDate) {
        constraints.push(where("occurredOn", "<=", validFilters.endDate));
      }

      constraints.push(
        orderBy(sortPlan.field, sortPlan.direction),
        orderBy("createdAt", sortPlan.direction),
        orderBy(documentId(), sortPlan.direction),
        ...cursorConstraints(cursor, sortPlan),
        limit(validFilters.pageSize + 1),
      );

      const snapshot = await getDocs(
        query(transactionCollection(this.firestore, ownerUid), ...constraints),
      );
      const hasNextPage = snapshot.docs.length > validFilters.pageSize;
      const pageDocuments = snapshot.docs.slice(0, validFilters.pageSize);
      const lastDocument = pageDocuments.at(-1);

      return {
        items: pageDocuments.map((item) =>
          transactionFromFirestore(item.id, item.data()),
        ),
        nextCursor:
          hasNextPage && lastDocument
            ? createCursor(lastDocument, sortPlan)
            : undefined,
      };
    } catch (error) {
      throw toTransactionsRepositoryError(error, "list");
    }
  }

  async listCategories(uid: string) {
    try {
      requireAuthenticatedUid(uid, "list-categories");
      const snapshot = await getDocs(
        query(
          collection(this.firestore, "transactionCategories"),
          orderBy("name", "asc"),
        ),
      );

      return snapshot.docs.map((item) =>
        transactionCategoryFromFirestore(item.id, item.data()),
      );
    } catch (error) {
      throw toTransactionsRepositoryError(error, "list-categories");
    }
  }
}

let repository: FirebaseTransactionsRepository | undefined;

export function getFirebaseTransactionsRepository(): FirebaseTransactionsRepository {
  repository ??= new FirebaseTransactionsRepository(
    getFirebaseServices().firestore,
  );

  return repository;
}
