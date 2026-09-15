import type { TransactionCategory } from "@banking/shared/types";
import {
  collection,
  count,
  documentId,
  getAggregateFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
  type Firestore,
  type Query,
} from "firebase/firestore";

import { getFirebaseServices } from "@mobile/services/firebase";
import { requireAuthenticatedUid } from "@mobile/features/transactions/data";
import {
  transactionCategoryFromFirestore,
  transactionFromFirestore,
} from "@mobile/features/transactions/data/transactionMappers";
import type {
  DashboardAggregate,
  DashboardCategoryData,
  DashboardDateRange,
  DashboardMonth,
  DashboardPeriod,
  DashboardRepository,
} from "../types";

function transactionsCollection(firestore: Firestore, uid: string) {
  return collection(firestore, "users", uid, "transactions");
}

function completedTransactionsQuery(
  firestore: Firestore,
  uid: string,
  range?: DashboardDateRange,
): Query {
  return query(
    transactionsCollection(firestore, uid),
    where("status", "==", "completed"),
    ...(range
      ? [
          where("occurredOn", ">=", range.startDate),
          where("occurredOn", "<=", range.endDate),
        ]
      : []),
  );
}

async function aggregate(queryValue: Query): Promise<DashboardAggregate> {
  const snapshot = await getAggregateFromServer(queryValue, {
    transactionCount: count(),
    incomeInCents: sum("incomeAmountInCents"),
    expenseInCents: sum("expenseAmountInCents"),
  });
  const data = snapshot.data();

  return {
    transactionCount: data.transactionCount,
    incomeInCents: data.incomeInCents,
    expenseInCents: data.expenseInCents,
  };
}

export class FirebaseDashboardRepository implements DashboardRepository {
  constructor(private readonly firestore: Firestore) {}

  async getSummary(uid: string, period: DashboardPeriod) {
    const ownerUid = requireAuthenticatedUid(uid, "list");
    const [allTime, current, previous] = await Promise.all([
      aggregate(completedTransactionsQuery(this.firestore, ownerUid)),
      aggregate(completedTransactionsQuery(this.firestore, ownerUid, period)),
      aggregate(completedTransactionsQuery(this.firestore, ownerUid, period.previous)),
    ]);

    return {
      balanceInCents: allTime.incomeInCents - allTime.expenseInCents,
      current,
      previous,
    };
  }

  async getMonthlyEvolution(uid: string, months: DashboardMonth[]) {
    const ownerUid = requireAuthenticatedUid(uid, "list");

    return Promise.all(
      months.map(async (month) => {
        const result = await aggregate(
          completedTransactionsQuery(this.firestore, ownerUid, month),
        );
        return {
          month,
          incomeInCents: result.incomeInCents,
          expenseInCents: result.expenseInCents,
        };
      }),
    );
  }

  async getCategoryDistribution(uid: string, range: DashboardDateRange) {
    const ownerUid = requireAuthenticatedUid(uid, "list");
    const categorySnapshot = await getDocs(
      query(collection(this.firestore, "transactionCategories"), orderBy("name", "asc")),
    );
    const categories = categorySnapshot.docs
      .map((item) => transactionCategoryFromFirestore(item.id, item.data()))
      .filter((category) => category.type !== "income");

    return Promise.all(
      categories.map((category: TransactionCategory): Promise<DashboardCategoryData> =>
        getAggregateFromServer(
          query(
            transactionsCollection(this.firestore, ownerUid),
            where("status", "==", "completed"),
            where("type", "==", "expense"),
            where("categoryId", "==", category.id),
            where("occurredOn", ">=", range.startDate),
            where("occurredOn", "<=", range.endDate),
          ),
          { amountInCents: sum("expenseAmountInCents") },
        ).then((snapshot) => ({
          categoryId: category.id,
          category: category.name,
          amountInCents: snapshot.data().amountInCents,
        })),
      ),
    );
  }

  async getRecentTransactions(uid: string, maximum = 5) {
    const ownerUid = requireAuthenticatedUid(uid, "list");
    const snapshot = await getDocs(
      query(
        transactionsCollection(this.firestore, ownerUid),
        orderBy("occurredOn", "desc"),
        orderBy("createdAt", "desc"),
        orderBy(documentId(), "desc"),
        limit(maximum),
      ),
    );

    return snapshot.docs.map((item) =>
      transactionFromFirestore(item.id, item.data()),
    );
  }
}

let repository: FirebaseDashboardRepository | undefined;

export function getFirebaseDashboardRepository(): FirebaseDashboardRepository {
  repository ??= new FirebaseDashboardRepository(getFirebaseServices().firestore);
  return repository;
}
