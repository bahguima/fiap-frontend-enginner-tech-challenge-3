import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { apiEndpoints } from "@banking/shared/api-client/endpoints";
import { createQueryClient } from "@banking/shared/query";
import { server } from "@banking/shared/testing/mocks/server";
import type { ApiErrorResponse } from "@banking/shared/types";
import { LanguageProvider } from "@dashboard/contexts/LanguageContext";
import ProfilePage from ".";

const renderPage = () =>
  render(
    <QueryClientProvider client={createQueryClient({ queries: { retry: false } })}>
      <LanguageProvider>
        <ProfilePage />
      </LanguageProvider>
    </QueryClientProvider>,
  );

describe("ProfilePage", () => {
  it("consulta e exibe o perfil preparado pela API", async () => {
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando perfil...",
    );
    expect(await screen.findByText("Fulano")).toBeInTheDocument();
    expect(screen.getByText("email@teste.com")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Jan 2025")).toBeInTheDocument();
  });

  it("expõe o idioma selecionado como estado acessível", async () => {
    renderPage();

    await screen.findByText("Fulano");
    const portugueseButton = screen.getByRole("button", {
      name: "Português",
    });
    const englishButton = screen.getByRole("button", { name: "English" });

    expect(portugueseButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(englishButton);
    expect(englishButton).toHaveAttribute("aria-pressed", "true");
    expect(portugueseButton).toHaveAttribute("aria-pressed", "false");
  });

  it("exibe erro de consulta e ação de nova tentativa", async () => {
    server.use(
      http.get<never, never, ApiErrorResponse>(
        apiEndpoints.profile,
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
      "Não foi possível carregar o perfil.",
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });
});
