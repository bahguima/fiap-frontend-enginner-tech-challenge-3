import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { render, screen } from "@testing-library/react";
import { apiEndpoints } from "@banking/shared/api-client/endpoints";
import { createQueryClient } from "@banking/shared/query";
import { mockDashboardHomeEmpty } from "@banking/shared/testing/mocks/fixtures/dashboard";
import { server } from "@banking/shared/testing/mocks/server";
import type {
  ApiErrorResponse,
  DashboardHomeResponse,
} from "@banking/shared/types";
import OverviewPage from ".";

const renderPage = () => {
  const queryClient = createQueryClient({ queries: { retry: false } });

  return render(
    <QueryClientProvider client={queryClient}>
      <OverviewPage />
    </QueryClientProvider>,
  );
};

describe("OverviewPage", () => {
  it("exibe o loading enquanto consulta as análises", () => {
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando análises financeiras...",
    );
  });

  it("renderiza os indicadores e análises preparados pelo backend", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Visão financeira" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saldo" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Total de receitas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Total de despesas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Transações recentes" }),
    ).toBeInTheDocument();
  });

  it("exibe erro e permite tentar novamente", async () => {
    server.use(
      http.get<never, never, ApiErrorResponse>(
        apiEndpoints.dashboard.home,
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

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Não foi possível carregar as análises financeiras.",
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });

  it("exibe o estado vazio recebido pelo contrato", async () => {
    server.use(
      http.get<never, never, DashboardHomeResponse>(
        apiEndpoints.dashboard.home,
        () =>
          HttpResponse.json<DashboardHomeResponse>(
            mockDashboardHomeEmpty,
          ),
      ),
    );

    renderPage();

    expect(
      await screen.findByText("Ainda não há dados financeiros"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Registre sua primeira transação para visualizar as análises deste período.",
      ),
    ).toBeInTheDocument();
  });
});
