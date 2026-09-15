import {
  dashboardQueryKeys,
  normalizeTransactionFilters,
  transactionAttachmentQueryKeys,
  transactionCategoryQueryKeys,
  transactionQueryKeys,
} from "./queryKeys";

describe("mobile query keys", () => {
  it("normalizes defaults and optional filter values", () => {
    expect(normalizeTransactionFilters({ categoryId: "  food  " })).toEqual({
      categoryId: "food",
      sort: "date-desc",
      pageSize: 20,
    });
    expect(transactionQueryKeys.infinite("uid-1", {})).toEqual(
      transactionQueryKeys.infinite("uid-1", {
        sort: "date-desc",
        pageSize: 20,
      }),
    );
  });

  it("segments all user data keys by uid", () => {
    expect(transactionQueryKeys.lists("uid-1")).not.toEqual(
      transactionQueryKeys.lists("uid-2"),
    );
    expect(dashboardQueryKeys.all("uid-1")).toEqual([
      "mobile",
      "users",
      "uid-1",
      "dashboard",
    ]);
    expect(dashboardQueryKeys.summary("uid-1", "2026-09")).toEqual([
      "mobile",
      "users",
      "uid-1",
      "dashboard",
      "summary",
      "2026-09",
    ]);
    expect(dashboardQueryKeys.monthly("uid-1", "2026-09")).not.toEqual(
      dashboardQueryKeys.categories("uid-1", "2026-09"),
    );
    expect(
      transactionAttachmentQueryKeys.byTransaction("uid-1", "tx-1"),
    ).toEqual([
      "mobile",
      "users",
      "uid-1",
      "transaction-attachments",
      "transaction",
      "tx-1",
    ]);
  });

  it("keeps global categories in their own key namespace", () => {
    expect(transactionCategoryQueryKeys.list()).toEqual([
      "mobile",
      "transaction-categories",
      "list",
    ]);
  });
});
