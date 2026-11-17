import { http, HttpResponse } from "msw";
import {
  attachmentsApi,
  authApi,
  categoriesApi,
  dashboardApi,
  profileApi,
  RestClient,
  RestClientError,
  transactionsApi,
} from "@banking/shared/api-client";
import type { CategoryListResponse } from "@banking/shared/types";
import { apiEndpoints } from "@banking/shared/api-client/endpoints";
import { server } from "../mocks/server";
import { signOutTestSession } from "../testSession";

describe("infraestrutura da API REST mockada", () => {
  it("mantém o ciclo de autenticação e rejeita credenciais inválidas", async () => {
    signOutTestSession();
    await expect(authApi.getSession()).resolves.toEqual({
      authenticated: false,
      user: null,
    });

    const session = await authApi.login({
      email: "email@teste.com",
      password: "123",
    });

    // O access token fica no store em memória; a fachada não o devolve.
    expect(session).not.toHaveProperty("accessToken");
    expect(session.user).toMatchObject({
      name: "Fulano",
      email: "email@teste.com",
    });
    await expect(authApi.getSession()).resolves.toEqual(session);
    await authApi.logout();
    await expect(authApi.getSession()).resolves.toEqual({
      authenticated: false,
      user: null,
    });
    await expect(
      authApi.login({ email: "invalido@teste.com", password: "errada" }),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("entrega dashboard e categorias prontos para apresentação", async () => {
    const [home, summary, monthly, categories, profile] = await Promise.all([
      dashboardApi.getHome(),
      dashboardApi.getSummary(),
      dashboardApi.getMonthly(),
      categoriesApi.list(),
      profileApi.get(),
    ]);

    expect(home.status).toBe("success");
    if (home.status !== "success") {
      throw new Error("O contrato de sucesso da Home era esperado.");
    }

    expect(home.balance.amount.formattedValue).toBe("R$ 12.740,57");
    expect(home.balance.comparisonText).toContain("período anterior");
    expect(home.cashFlow.sixthPeriod.incomeHeight).toBe("100%");
    expect(
      home.categoryDistribution.firstCategory.formattedPercentage,
    ).toBe("38%");
    expect(home.recentTransactions.firstTransaction).toMatchObject({
      description: "Depósito de salário",
      formattedAmount: "+R$ 8.500,00",
    });
    expect(summary.balance.formattedValue).toMatch(/^R\$\s/);
    expect(summary.totalIncome.value).toBeGreaterThan(0);
    expect(monthly.labels).toEqual(["Nov", "Dez", "Jan", "Fev", "Mar", "Abr"]);
    expect(monthly.incomeValues).toEqual([
      12400,
      14200,
      11800,
      13500,
      15840,
      17468,
    ]);
    expect(categories.items).toContainEqual({
      id: "category-1",
      name: "Depósito",
      type: "income",
    });
    expect(profile).toEqual({
      name: "Fulano",
      email: "email@teste.com",
      planLabel: "Premium",
      memberSinceLabel: "Jan 2025",
    });
  });

  it("lista, filtra, cria, atualiza e exclui transações", async () => {
    const expenses = await transactionsApi.list({
      type: "expense",
      limit: 2,
    });

    expect(expenses.items).toHaveLength(2);
    expect(expenses.total).toBe(4);
    expect(expenses.items.every((transaction) => transaction.type === "expense")).toBe(true);

    const filteredTransactions = await transactionsApi.list({
      search: "projeto",
      type: "income",
      category: "Transferência",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      minimumAmount: 2000,
      maximumAmount: 3000,
      sort: "amount-desc",
      page: 1,
      pageSize: 5,
    });

    expect(filteredTransactions).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 5,
      totalPages: 1,
      previousPage: null,
      nextPage: null,
    });
    expect(filteredTransactions.items[0]).toMatchObject({
      description: "Pagamento de projeto",
      formattedAmount: "+R$ 2.200,00",
    });

    const secondPage = await transactionsApi.list({
      page: 2,
      pageSize: 5,
    });

    expect(secondPage).toMatchObject({
      total: 6,
      page: 2,
      totalPages: 2,
      previousPage: 1,
      nextPage: null,
      resultsLabel: "Exibindo 6 a 6 de 6 transações",
    });
    expect(secondPage.items).toHaveLength(1);

    const created = await transactionsApi.create({
      description: "Nova entrada",
      amount: 350,
      type: "income",
      category: "Transferência",
      date: "2026-07-23",
      status: "completed",
    });

    expect(created).toMatchObject({
      formattedAmount: "+R$ 350,00",
      typeLabel: "Entrada",
      formattedDate: "23/07/2026",
    });

    const updated = await transactionsApi.update(created.id, {
      description: "Nova saída",
      amount: 125,
      type: "expense",
      category: "Pagamento",
      date: "2026-07-22",
      status: "pending",
    });

    expect(updated).toMatchObject({
      amount: -125,
      statusLabel: "Pendente",
    });
    await expect(transactionsApi.remove(created.id)).resolves.toEqual({
      message: "Transação excluída com sucesso.",
    });
    await expect(transactionsApi.remove(created.id)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("retorna erros de validação tipados para transações inválidas", async () => {
    await expect(
      transactionsApi.create({
        description: "x",
        amount: 0,
        type: "expense",
        category: "Outro",
        date: "",
        status: "completed",
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION_ERROR",
      details: {
        description: ["Informe uma descrição com pelo menos 3 caracteres."],
        amount: [
          "Informe um valor entre R$ 0,01 e R$ 999.999.999,99.",
        ],
      },
    });
  });

  it("aplica os limites avançados também no contrato REST", async () => {
    await expect(
      transactionsApi.create({
        description: "x".repeat(121),
        amount: 1000000000,
        type: "expense",
        category: "Categoria inexistente",
        date: "2999-01-01",
        status: "completed",
        observation: "x".repeat(501),
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION_ERROR",
      details: {
        description: [
          "A descrição deve ter no máximo 120 caracteres.",
        ],
        amount: [
          "Informe um valor entre R$ 0,01 e R$ 999.999.999,99.",
        ],
        category: ["Selecione uma categoria fornecida pela API."],
        date: ["Informe uma data válida que não esteja no futuro."],
        observation: [
          "A observação deve ter no máximo 500 caracteres.",
        ],
      },
    });
  });

  it("mantém anexos vinculados às transações", async () => {
    const created = await attachmentsApi.create("transaction-1", {
      file: new File([new Uint8Array(2048)], "recibo.pdf", {
        type: "application/pdf",
      }),
    });

    expect(created).toMatchObject({
      transactionId: "transaction-1",
      formattedSize: "2 KB",
    });

    const attachments = await attachmentsApi.list("transaction-1");
    expect(attachments.items).toContainEqual(created);
    await expect(attachmentsApi.remove(created.id)).resolves.toEqual({
      message: "Anexo excluído com sucesso.",
    });
    await expect(attachmentsApi.list("inexistente")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("valida MIME type, tamanho e quantidade dos anexos no REST mockado", async () => {
    await expect(
      attachmentsApi.create("transaction-1", {
        file: new File(["planilha"], "dados.csv", {
          type: "text/csv",
        }),
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION_ERROR",
      details: {
        file: ["Envie um arquivo PDF, JPEG ou PNG."],
      },
    });

    await expect(
      attachmentsApi.create("transaction-1", {
        file: new File(
          [new Uint8Array(5 * 1024 * 1024 + 1)],
          "grande.pdf",
          { type: "application/pdf" },
        ),
      }),
    ).rejects.toMatchObject({
      status: 422,
      details: {
        file: ["Cada arquivo deve ter no máximo 5 MB."],
      },
    });

    for (let index = 1; index <= 5; index += 1) {
      await attachmentsApi.create("transaction-1", {
        file: new File([`${index}`], `arquivo-${index}.pdf`, {
          type: "application/pdf",
        }),
      });
    }

    await expect(
      attachmentsApi.create("transaction-1", {
        file: new File(["6"], "arquivo-6.pdf", {
          type: "application/pdf",
        }),
      }),
    ).rejects.toMatchObject({
      status: 422,
      details: {
        file: ["Cada transação pode ter no máximo 5 anexos."],
      },
    });
  });

  it("permite forçar erro e latência de maneira determinística", async () => {
    const client = new RestClient();
    const startedAt = Date.now();

    await client.request<CategoryListResponse>(apiEndpoints.categories.list, {
      headers: { "x-mock-delay-ms": "20" },
    });

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);

    await expect(
      client.request<CategoryListResponse>(apiEndpoints.categories.list, {
        headers: { "x-mock-error": "true" },
      }),
    ).rejects.toBeInstanceOf(RestClientError);
    await expect(
      client.request<CategoryListResponse>(
        `${apiEndpoints.categories.list}?mockError=true`,
      ),
    ).rejects.toMatchObject({
      status: 503,
      code: "MOCK_ERROR",
    });
  });

  it("revalida categorias com ETag e reaproveita o corpo em 304", async () => {
    const statuses: number[] = [];
    const sentEtags: (string | null)[] = [];
    const client = new RestClient({
      fetcher: async (input, init) => {
        sentEtags.push(new Headers(init?.headers).get("If-None-Match"));
        const response = await fetch(input, init);
        statuses.push(response.status);
        return response;
      },
    });

    const first = await client.request<CategoryListResponse>(
      apiEndpoints.categories.list,
      { conditional: true },
    );
    const second = await client.request<CategoryListResponse>(
      apiEndpoints.categories.list,
      { conditional: true },
    );

    expect(statuses).toEqual([200, 304]);
    expect(sentEtags[0]).toBeNull();
    expect(sentEtags[1]).toMatch(/^"categories-/);
    expect(second).toEqual(first);
    expect(second.items.length).toBeGreaterThan(0);
  });

  it("não envia If-None-Match sem revalidação condicional", async () => {
    const statuses: number[] = [];
    const client = new RestClient({
      fetcher: async (input, init) => {
        const response = await fetch(input, init);
        statuses.push(response.status);
        return response;
      },
    });

    await client.request(apiEndpoints.categories.list);
    await client.request(apiEndpoints.categories.list);

    expect(statuses).toEqual([200, 200]);
  });

  it("falha em requests não tratados durante os testes", async () => {
    server.use(
      http.get("/api/infra/custom", () =>
        HttpResponse.json({ available: true }),
      ),
    );

    await expect(fetch("http://localhost/api/infra/custom")).resolves.toMatchObject({
      status: 200,
    });
  });

  it("normaliza respostas de erro fora do contrato", async () => {
    const client = new RestClient({
      fetcher: async () =>
        new Response(JSON.stringify({}), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
    });

    await expect(client.request("/api/teste")).rejects.toMatchObject({
      status: 502,
      code: "INTERNAL_ERROR",
    });
  });

  it("inclui cookies (credentials) nas requisições", async () => {
    const fetcher = jest.fn(
      async () =>
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const client = new RestClient({ fetcher });

    await client.request("/api/teste");

    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
