import {
  TransactionsRepositoryError,
  requireAuthenticatedUid,
  toTransactionsRepositoryError,
} from "./transactionErrors";

describe("transaction repository errors", () => {
  it.each([
    ["firestore/permission-denied", "permission-denied"],
    ["not-found", "not-found"],
    ["firestore/unavailable", "unavailable"],
    ["firestore/aborted", "conflict"],
    ["something-new", "unknown"],
  ])("maps %s to %s", (firebaseCode, expectedCode) => {
    expect(
      toTransactionsRepositoryError({ code: firebaseCode }, "list"),
    ).toMatchObject({ code: expectedCode, operation: "list" });
  });

  it("keeps an already standardized error unchanged", () => {
    const error = new TransactionsRepositoryError("invalid-data", "read");
    expect(toTransactionsRepositoryError(error, "read")).toBe(error);
  });

  it("adds the public repository operation to mapper errors", () => {
    const mapperError = new TransactionsRepositoryError(
      "invalid-data",
      "read",
    );
    expect(toTransactionsRepositoryError(mapperError, "list")).toMatchObject({
      code: "invalid-data",
      operation: "list",
      cause: mapperError,
    });
  });

  it("requires a non-empty authenticated uid", () => {
    expect(() => requireAuthenticatedUid(" ", "create")).toThrow(
      TransactionsRepositoryError,
    );
    expect(requireAuthenticatedUid(" user-1 ", "create")).toBe("user-1");
  });
});
