import { authApi, authSession, dashboardApi } from "@banking/shared/api-client";
import {
  cachePolicies,
  createQueryClient,
  QUERY_CACHE_STORAGE_KEY,
} from "@banking/shared/query";
import { decryptString, deriveSessionKey } from "@banking/shared/security";
import { signOutTestSession } from "@banking/shared/testing/testSession";
import { bindEncryptedQueryPersistence } from "./encryptedQueryPersistence";

const summaryKey = ["dashboard", "summary"];
const transactionsKey = ["transactions", "list", {}];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitUntil = async (
  assertion: () => boolean | Promise<boolean>,
  timeoutMs = 8000,
) => {
  const startedAt = Date.now();
  while (!(await assertion())) {
    if (Date.now() - startedAt > timeoutMs) throw new Error("tempo esgotado");
    await sleep(10);
  }
};

/** Todo o conteúdo legível por JavaScript: storages e cookies. */
const readAllClientStorage = () =>
  [
    ...Object.keys(localStorage).map((key) => `${key}=${localStorage.getItem(key)}`),
    ...Object.keys(sessionStorage).map(
      (key) => `${key}=${sessionStorage.getItem(key)}`,
    ),
    document.cookie,
  ].join("\n");

type TestQueryClient = ReturnType<typeof createQueryClient>;

async function seed(queryClient: TestQueryClient) {
  await queryClient.fetchQuery({
    queryKey: summaryKey,
    queryFn: () => dashboardApi.getSummary(),
    ...cachePolicies.dashboard,
  });
  queryClient.setQueryData(transactionsKey, { items: [{ description: "Aluguel" }] });
}

/** Liga a persistência e devolve uma promessa da próxima restauração. */
function bindForTest(queryClient: TestQueryClient) {
  let markRestored: () => void = () => undefined;
  const restored = new Promise<void>((resolve) => {
    markRestored = resolve;
  });
  const unbind = bindEncryptedQueryPersistence(queryClient, {
    storage: localStorage,
    throttleTime: 0,
    onRestored: () => markRestored(),
  });
  return { unbind, restored };
}

/**
 * Decifra o blob gravado (com a chave derivada do `sessionKey` da sessão,
 * como faria a mesma sessão após recarregar) e devolve as keys persistidas.
 */
async function readPersistedQueryKeys(sessionKey: string) {
  const raw = localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
  if (!raw) return [];
  const key = await deriveSessionKey(sessionKey);
  const plaintext = await decryptString(key, JSON.parse(raw), QUERY_CACHE_STORAGE_KEY);
  const client = JSON.parse(plaintext) as {
    clientState: { queries: { queryKey: unknown[] }[] };
  };
  return client.clientState.queries.map((query) => JSON.stringify(query.queryKey));
}

async function loginAndPersist(queryClient: TestQueryClient) {
  const grantSpy = jest.spyOn(authSession, "applyGrant");
  const { unbind, restored } = bindForTest(queryClient);
  await authApi.login({ email: "email@teste.com", password: "123" });
  const sessionKey = grantSpy.mock.calls.at(-1)?.[0].sessionKey ?? "";
  // Aguarda a derivação da chave e a ativação da persistência.
  await restored;
  await seed(queryClient);
  // A primeira gravação acontece com a query ainda pendente (vazia); espera a
  // gravação que já contém o resumo.
  await waitUntil(async () =>
    (await readPersistedQueryKeys(sessionKey)).includes(JSON.stringify(summaryKey)),
  );
  return { unbind, sessionKey };
}

describe("persistência criptografada do cache (shell)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    signOutTestSession();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("persiste o resumo do dashboard cifrado e o restaura após recarregar", async () => {
    const queryClient = createQueryClient();
    const { unbind, sessionKey } = await loginAndPersist(queryClient);

    const persisted = localStorage.getItem(QUERY_CACHE_STORAGE_KEY) ?? "";
    expect(JSON.parse(persisted)).toMatchObject({ v: 1 });
    expect(persisted).not.toContain("R$");
    expect(persisted).not.toContain("Aluguel");
    await expect(readPersistedQueryKeys(sessionKey)).resolves.not.toContain(
      JSON.stringify(transactionsKey),
    );
    unbind();
    const summary = queryClient.getQueryData(summaryKey);
    queryClient.clear();

    // "Recarregar": memória do cliente zerada; o cookie HttpOnly segue válido.
    authSession.reset();
    const reloaded = createQueryClient();
    const { unbind: unbindReloaded, restored } = bindForTest(reloaded);
    await authApi.getSession();
    await restored;

    expect(reloaded.getQueryData(summaryKey)).toEqual(summary);
    // Transações nunca são persistidas, nem cifradas.
    expect(reloaded.getQueryData(transactionsKey)).toBeUndefined();
    unbindReloaded();
    reloaded.clear();
  });

  it("apaga o cache cifrado e descarta a chave no logout", async () => {
    const queryClient = createQueryClient();
    const { unbind } = await loginAndPersist(queryClient);

    await authApi.logout();
    await waitUntil(() => localStorage.getItem(QUERY_CACHE_STORAGE_KEY) === null);

    queryClient.setQueryData(summaryKey, { balance: "depois do logout" });
    await sleep(50);
    expect(localStorage.getItem(QUERY_CACHE_STORAGE_KEY)).toBeNull();
    unbind();
    queryClient.clear();
  });

  it("não grava tokens nem o material de chave em storage ou cookies", async () => {
    const grantSpy = jest.spyOn(authSession, "applyGrant");
    const queryClient = createQueryClient();
    const { unbind } = await loginAndPersist(queryClient);
    // Força também uma restauração por refresh (tokens rotacionados).
    authSession.reset();
    await authApi.getSession();

    const secrets = grantSpy.mock.calls.flatMap(([grant]) => [
      grant.accessToken,
      grant.csrfToken,
      grant.sessionKey,
    ]);
    expect(secrets.length).toBeGreaterThanOrEqual(6);

    const everything = readAllClientStorage();
    expect(everything).toContain(QUERY_CACHE_STORAGE_KEY);
    secrets.forEach((secret) => expect(everything).not.toContain(secret));
    expect(everything).not.toMatch(/eyJ[\w-]+\.[\w-]+\./); // nenhum JWT
    expect(everything.toLowerCase()).not.toMatch(/refresh|bearer|access_?token/);

    // O cache do Query também não guarda tokens: o login devolve só a sessão.
    const cachedData = JSON.stringify(
      queryClient.getQueryCache().getAll().map((query) => query.state.data),
    );
    secrets.forEach((secret) => expect(cachedData).not.toContain(secret));

    unbind();
    queryClient.clear();
  });
});
