import { render, screen } from "@testing-library/react";
import { DashboardApp } from ".";

jest.mock("@dashboard/views/dashboard/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@dashboard/views/dashboard/OverviewPage", () => ({
  __esModule: true,
  default: () => <h1>Visão financeira</h1>,
}));

jest.mock("@dashboard/views/dashboard/ProfilePage", () => ({
  __esModule: true,
  default: () => <h1>Perfil</h1>,
}));

// Usada somente no teste de fallback: o chunk lazy é cacheado após a primeira
// resolução, então nenhuma outra rota deste arquivo pode carregá-la antes.
jest.mock("@dashboard/views/dashboard/ExpensesPage", () => ({
  __esModule: true,
  default: () => <h1>Saídas</h1>,
}));

describe("DashboardApp", () => {
  it("renderiza a Home autenticada na rota principal", async () => {
    render(<DashboardApp pathname="/dashboard" />);

    expect(
      await screen.findByRole("heading", { name: "Visão financeira" }),
    ).toBeInTheDocument();
  });

  it("preserva o roteamento interno do dashboard", async () => {
    render(<DashboardApp pathname="/dashboard/profile" />);

    expect(
      await screen.findByRole("heading", { name: "Perfil" }),
    ).toBeInTheDocument();
  });

  it("exibe um fallback acessível enquanto o chunk da página carrega", async () => {
    render(<DashboardApp pathname="/dashboard/expenses" />);

    // O chunk lazy ainda não resolveu: o Suspense mostra o status anunciável.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando página...",
    );
    expect(
      screen.queryByRole("heading", { name: "Saídas" }),
    ).not.toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "Saídas" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Carregando página..."),
    ).not.toBeInTheDocument();
  });

  it("mantém a visão geral como rota padrão para caminhos desconhecidos", async () => {
    render(<DashboardApp pathname="/dashboard/desconhecida" />);

    expect(
      await screen.findByRole("heading", { name: "Visão financeira" }),
    ).toBeInTheDocument();
  });
});
