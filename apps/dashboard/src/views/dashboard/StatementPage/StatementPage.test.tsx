import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { apiEndpoints } from "@banking/shared/api-client/endpoints";
import { createQueryClient } from "@banking/shared/query";
import { listMockTransactions } from "@banking/shared/testing/mocks/state";
import { server } from "@banking/shared/testing/mocks/server";
import type {
  ApiErrorResponse,
  TransactionListResponse,
} from "@banking/shared/types";

import StatementPage from ".";

const renderPage = () => {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <StatementPage />
    </QueryClientProvider>,
  );
};

describe("StatementPage", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/dashboard/statement");
  });

  it("exibe o estado de carregamento inicial", () => {
    renderPage();

    expect(screen.getByText("Carregando extrato...")).toBeInTheDocument();
  });

  it("sincroniza os filtros da URL e consulta a API REST", async () => {
    window.history.replaceState(
      null,
      "",
      "/dashboard/statement?type=expense&pageSize=5",
    );

    renderPage();

    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveValue(
      "expense",
    );

    expect(
      await screen.findByText("Compra no mercado", { selector: "td" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Depósito de salário", { selector: "td" }),
    ).not.toBeInTheDocument();
  });

  it("exibe o contador e carrega os anexos persistidos ao abrir os detalhes", async () => {
    renderPage();

    expect(
      await screen.findByText("Assinatura de streaming", { selector: "td" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1 anexo").length).toBeGreaterThan(0);

    fireEvent.pointerDown(
      screen.getAllByRole("button", {
        name: "Ações para Assinatura de streaming",
      })[0],
      { button: 0, ctrlKey: false },
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Ver detalhes" }),
    );

    expect(
      await screen.findByRole("list", { name: "Anexos da transação" }),
    ).toHaveTextContent("comprovante-streaming.pdf");
    expect(screen.getByText("240 KB")).toBeInTheDocument();
  });

  it("envia todos os filtros avançados e exibe somente o resultado da API", async () => {
    renderPage();

    await screen.findByRole("option", { name: "Transferência" });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Aplicar filtros" }),
      ).toBeEnabled();
    });

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar por texto" }),
      { target: { value: "projeto" } },
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), {
      target: { value: "income" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), {
      target: { value: "Transferência" },
    });
    fireEvent.change(screen.getByLabelText("De"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText("Até"), {
      target: { value: "2026-04-30" },
    });
    fireEvent.change(screen.getByLabelText("Valor mínimo"), {
      target: { value: "2000" },
    });
    fireEvent.change(screen.getByLabelText("Valor máximo"), {
      target: { value: "3000" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar por" }), {
      target: { value: "amount-desc" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Itens por página" }),
      { target: { value: "5" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    );

    await waitFor(() => {
      const searchParams = new URLSearchParams(window.location.search);
      expect(searchParams.get("search")).toBe("projeto");
      expect(searchParams.get("type")).toBe("income");
      expect(searchParams.get("category")).toBe("Transferência");
      expect(searchParams.get("startDate")).toBe("2026-04-01");
      expect(searchParams.get("endDate")).toBe("2026-04-30");
      expect(searchParams.get("minimumAmount")).toBe("2000");
      expect(searchParams.get("maximumAmount")).toBe("3000");
      expect(searchParams.get("sort")).toBe("amount-desc");
      expect(searchParams.get("pageSize")).toBe("5");
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Compra no mercado", { selector: "td" }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("Pagamento de projeto", { selector: "td" }),
    ).toBeInTheDocument();
  });

  it("mantém a página anterior visível durante a paginação tradicional", async () => {
    server.use(
      http.get<never, never, TransactionListResponse>(
        apiEndpoints.transactions.list,
        async ({ request }) => {
          const page = new URL(request.url).searchParams.get("page");
          if (page === "2") await delay(80);

          return HttpResponse.json(
            listMockTransactions({
              page: page === "2" ? 2 : 1,
              pageSize: 5,
            }),
          );
        },
      ),
    );
    window.history.replaceState(
      null,
      "",
      "/dashboard/statement?pageSize=5",
    );
    renderPage();

    expect(
      await screen.findByText("Depósito de salário", { selector: "td" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Ir para a próxima página" }),
    );

    expect(screen.getByText("Atualizando transações...")).toBeInTheDocument();
    expect(
      screen.getByText("Depósito de salário", { selector: "td" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get("page")).toBe("2");
      expect(
        screen.getByText("Aplicação financeira", { selector: "td" }),
      ).toBeInTheDocument();
    });
  });

  it("diferencia lista vazia de busca sem resultados", async () => {
    server.use(
      http.get<never, never, TransactionListResponse>(
        apiEndpoints.transactions.list,
        () =>
          HttpResponse.json<TransactionListResponse>({
            items: [],
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 0,
            firstPage: 1,
            previousPage: null,
            nextPage: null,
            lastPage: 1,
            resultsLabel: "Nenhuma transação",
          }),
      ),
    );

    const firstRender = renderPage();
    expect(
      await screen.findByText("Nenhuma transação cadastrada."),
    ).toBeInTheDocument();
    firstRender.unmount();

    window.history.replaceState(
      null,
      "",
      "/dashboard/statement?search=inexistente",
    );
    renderPage();

    expect(
      await screen.findByText(
        "Nenhuma transação corresponde aos filtros aplicados.",
      ),
    ).toBeInTheDocument();
  });

  it("exibe erro de consulta e oferece nova tentativa", async () => {
    server.use(
      http.get<never, never, ApiErrorResponse>(
        apiEndpoints.transactions.list,
        () =>
          HttpResponse.json<ApiErrorResponse>(
            {
              error: {
                code: "MOCK_ERROR",
                message: "Erro simulado.",
              },
            },
            { status: 503 },
          ),
      ),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o extrato.",
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });
});
