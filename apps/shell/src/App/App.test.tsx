import { render, screen } from "@testing-library/react";
import { useAuth } from "@banking/shared/auth";
import { App } from ".";

jest.mock("../mf", () => ({
  loadRemoteComponent: jest.fn(),
  loadRemoteComponentOnce: jest.fn(),
  preloadDashboard: jest.fn(),
}));
jest.mock("@banking/shared/auth", () => ({
  useAuth: jest.fn(),
}));

interface RemoteProps {
  pathname?: string;
}

const InstitutionalRemote = ({ pathname }: RemoteProps) => (
  <>
    <h2>Conteúdo institucional remoto</h2>
    <p>Caminho institucional: {pathname}</p>
  </>
);

const DashboardRemote = ({ pathname }: RemoteProps) => (
  <>
    <h2>Conteúdo do dashboard remoto</h2>
    <p>Caminho do dashboard: {pathname}</p>
  </>
);

describe("Shell", () => {
  beforeEach(() => {
    jest.mocked(useAuth).mockReturnValue({
      user: { name: "Fulano", email: "email@teste.com" },
      isLoading: false,
    sessionEndReason: null,
      login: jest.fn(async () => ({ status: "authenticated" as const })),
      logout: jest.fn(async () => {}),
    });
  });

  it("carrega somente o remote institucional na rota inicial", async () => {
    const institutionalLoader = jest.fn(async () => InstitutionalRemote);
    const dashboardLoader = jest.fn(async () => DashboardRemote);

    render(
      <App
        pathname="/"
        institutionalLoader={institutionalLoader}
        dashboardLoader={dashboardLoader}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Conteúdo institucional remoto",
      }),
    ).toBeInTheDocument();
    expect(institutionalLoader).toHaveBeenCalledTimes(1);
    expect(dashboardLoader).not.toHaveBeenCalled();
  });

  it("carrega somente o remote de dashboard em sua rota", async () => {
    const institutionalLoader = jest.fn(async () => InstitutionalRemote);
    const dashboardLoader = jest.fn(async () => DashboardRemote);

    render(
      <App
        pathname="/dashboard"
        institutionalLoader={institutionalLoader}
        dashboardLoader={dashboardLoader}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Conteúdo do dashboard remoto",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Caminho do dashboard: /dashboard")).toBeInTheDocument();
    expect(dashboardLoader).toHaveBeenCalledTimes(1);
    expect(institutionalLoader).not.toHaveBeenCalled();
  });

  it("redireciona a rota protegida ao login sem carregar o dashboard", async () => {
    jest.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    sessionEndReason: null,
      login: jest.fn(async () => ({ status: "error" as const })),
      logout: jest.fn(async () => {}),
    });
    const institutionalLoader = jest.fn(async () => InstitutionalRemote);
    const dashboardLoader = jest.fn(async () => DashboardRemote);

    render(
      <App
        pathname="/dashboard"
        institutionalLoader={institutionalLoader}
        dashboardLoader={dashboardLoader}
      />,
    );

    expect(
      await screen.findByText("Caminho institucional: /login"),
    ).toBeInTheDocument();
    expect(institutionalLoader).toHaveBeenCalledTimes(1);
    expect(dashboardLoader).not.toHaveBeenCalled();
  });
});
