import type { QueryClient } from "@tanstack/react-query";
import {
  cachePolicies,
  createQueryClient,
  enableQueryPersistence,
  QUERY_CACHE_STORAGE_KEY,
  type SyncCacheStorage,
} from "./index";

function createMemoryStorage(): SyncCacheStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const categoriesKey = ["transactions", "categories"];
const transactionsKey = ["transactions", "list", {}];
const dashboardKey = ["dashboard", "summary"];
const sessionKey = ["auth", "session"];

async function seedCache(queryClient: QueryClient) {
  await Promise.all([
    queryClient.fetchQuery({
      queryKey: categoriesKey,
      queryFn: async () => ({ items: [{ id: "category-1", name: "Depósito" }] }),
      ...cachePolicies.categories,
    }),
    queryClient.fetchQuery({
      queryKey: transactionsKey,
      queryFn: async () => ({ items: [{ id: "tx-1", amount: 1500 }] }),
      ...cachePolicies.transactions,
    }),
    queryClient.fetchQuery({
      queryKey: dashboardKey,
      queryFn: async () => ({ balance: 9999 }),
      ...cachePolicies.dashboard,
    }),
    queryClient.fetchQuery({
      queryKey: sessionKey,
      queryFn: async () => ({ authenticated: true, user: { email: "a@b.c" } }),
      ...cachePolicies.session,
    }),
  ]);
}

const flushThrottle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("persistência do cache", () => {
  it("grava e restaura somente as queries da allowlist (categorias)", async () => {
    const storage = createMemoryStorage();
    const source = createQueryClient();
    const [stopSource, sourceRestored] = enableQueryPersistence(source, {
      storage,
      throttleTime: 0,
    });
    await sourceRestored;

    await seedCache(source);
    await flushThrottle();
    stopSource();

    const persisted = storage.data.get(QUERY_CACHE_STORAGE_KEY) ?? "";
    expect(persisted).toContain("Depósito");
    expect(persisted).not.toContain("tx-1");
    expect(persisted).not.toContain("balance");
    expect(persisted).not.toContain("a@b.c");

    const target = createQueryClient();
    const [stopTarget, targetRestored] = enableQueryPersistence(target, {
      storage,
      throttleTime: 0,
    });
    await targetRestored;
    stopTarget();

    expect(target.getQueryData(categoriesKey)).toEqual({
      items: [{ id: "category-1", name: "Depósito" }],
    });
    expect(target.getQueryData(transactionsKey)).toBeUndefined();
    expect(target.getQueryData(dashboardKey)).toBeUndefined();
    expect(target.getQueryData(sessionKey)).toBeUndefined();

    source.clear();
    target.clear();
  });

  it("descarta o cache persistido com buster diferente", async () => {
    const storage = createMemoryStorage();
    const source = createQueryClient();
    const [stopSource] = enableQueryPersistence(source, {
      storage,
      throttleTime: 0,
      buster: "v1",
    });
    await seedCache(source);
    await flushThrottle();
    stopSource();

    const target = createQueryClient();
    const [stopTarget, restored] = enableQueryPersistence(target, {
      storage,
      buster: "v2",
    });
    await restored;
    stopTarget();

    expect(target.getQueryData(categoriesKey)).toBeUndefined();
    source.clear();
    target.clear();
  });

  it("aceita um persister customizado como ponto de extensão", async () => {
    const persister = {
      persistClient: jest.fn(),
      restoreClient: jest.fn().mockResolvedValue(undefined),
      removeClient: jest.fn(),
    };
    const queryClient = createQueryClient();
    const [stop, restored] = enableQueryPersistence(queryClient, { persister });
    await restored;
    await seedCache(queryClient);
    stop();

    expect(persister.restoreClient).toHaveBeenCalled();
    expect(persister.persistClient).toHaveBeenCalled();
    const lastSave = persister.persistClient.mock.calls.at(-1)?.[0];
    expect(
      lastSave.clientState.queries.map((query: { queryKey: unknown }) => query.queryKey),
    ).toEqual([categoriesKey]);
    queryClient.clear();
  });
});
