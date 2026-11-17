import { cachePolicies, createQueryClient, getCacheDomain } from "./index";

describe("cachePolicies", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ordena o staleTime pela volatilidade de cada domínio", () => {
    expect(cachePolicies.categories.staleTime).toBeGreaterThan(
      cachePolicies.dashboard.staleTime,
    );
    expect(cachePolicies.dashboard.staleTime).toBeGreaterThan(
      cachePolicies.transactions.staleTime,
    );
    expect(getCacheDomain(cachePolicies.session.meta)).toBe("session");
    expect(getCacheDomain({ cacheDomain: "desconhecido" })).toBeNull();
  });

  it.each([
    ["categories", cachePolicies.categories],
    ["dashboard", cachePolicies.dashboard],
    ["transactions", cachePolicies.transactions],
  ] as const)(
    "não refaz a consulta de %s dentro do staleTime e refaz depois dele",
    async (domain, policy) => {
      const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
      const queryClient = createQueryClient();
      const queryFn = jest.fn().mockResolvedValue({ domain });
      const options = { queryKey: [domain], queryFn, ...policy };

      await queryClient.fetchQuery(options);
      now.mockReturnValue(1_000_000 + policy.staleTime - 1);
      await queryClient.fetchQuery(options);

      expect(queryFn).toHaveBeenCalledTimes(1);

      now.mockReturnValue(1_000_000 + policy.staleTime + 1);
      await queryClient.fetchQuery(options);

      expect(queryFn).toHaveBeenCalledTimes(2);
      queryClient.clear();
    },
  );
});
