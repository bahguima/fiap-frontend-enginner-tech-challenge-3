import {
  createQueryClient,
  MAX_QUERY_RETRIES,
  queryRetryDelay,
  shouldRetryQuery,
} from "./index";

const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

describe("retry inteligente", () => {
  it.each([400, 401, 403, 404, 409, 422, 429])("não repete %i", (status) => {
    expect(shouldRetryQuery(0, httpError(status))).toBe(false);
  });

  it.each([500, 502, 503])("repete %i até o limite", (status) => {
    expect(shouldRetryQuery(0, httpError(status))).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, httpError(status))).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, httpError(status))).toBe(false);
  });

  it("repete falhas de rede e não repete cancelamentos", () => {
    expect(shouldRetryQuery(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(
      shouldRetryQuery(0, Object.assign(new Error("abort"), { name: "AbortError" })),
    ).toBe(false);
  });

  it("aplica backoff exponencial limitado", () => {
    expect([0, 1, 2, 3, 10].map(queryRetryDelay)).toEqual([
      500, 1000, 2000, 4000, 4000,
    ]);
  });

  it("o QueryClient padrão tenta 1 + 2 vezes em 5xx e 1 vez em 4xx", async () => {
    const queryClient = createQueryClient({ queries: { retryDelay: 0 } });
    const serverError = jest.fn().mockRejectedValue(httpError(503));
    const clientError = jest.fn().mockRejectedValue(httpError(404));

    await expect(
      queryClient.fetchQuery({ queryKey: ["5xx"], queryFn: serverError }),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      queryClient.fetchQuery({ queryKey: ["4xx"], queryFn: clientError }),
    ).rejects.toMatchObject({ status: 404 });

    expect(serverError).toHaveBeenCalledTimes(1 + MAX_QUERY_RETRIES);
    expect(clientError).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
