import { fireEvent, render, screen } from "@testing-library/react";
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

const InstitutionalRemote = ({ pathname }: RemoteProps) =>
  pathname === "/login" ? (
    <form onSubmit={(event) => event.preventDefault()}>
      <button type="submit">Entrar</button>
    </form>
  ) : (
    <>
      <a href="/login">Entrar</a>
      <a href="/sobre">Sobre</a>
    </>
  );

const DashboardRemote = () => <h2>Conteúdo do dashboard remoto</h2>;

type AuthState = ReturnType<typeof useAuth>;

const mockAuth = (user: AuthState["user"]) =>
  jest.mocked(useAuth).mockReturnValue({
    user,
    isLoading: false,
    sessionEndReason: null,
    login: jest.fn(async () => ({ status: "authenticated" as const })),
    logout: jest.fn(async () => {}),
  });

const renderShell = (pathname: string) => {
  const dashboardPreloader = jest.fn();
  const dashboardLoader = jest.fn(async () => DashboardRemote);
  const utils = render(
    <App
      pathname={pathname}
      institutionalLoader={async () => InstitutionalRemote}
      dashboardLoader={dashboardLoader}
      dashboardPreloader={dashboardPreloader}
    />,
  );

  return { ...utils, dashboardPreloader, dashboardLoader };
};

describe("Shell – pré-carregamento do dashboard", () => {
  beforeEach(() => {
    mockAuth(null);
  });

  it("não baixa o dashboard sem intenção do visitante", async () => {
    const { dashboardPreloader, dashboardLoader } = renderShell("/");

    await screen.findByRole("link", { name: "Entrar" });
    fireEvent.mouseOver(screen.getByRole("link", { name: "Sobre" }));

    expect(dashboardPreloader).not.toHaveBeenCalled();
    expect(dashboardLoader).not.toHaveBeenCalled();
  });

  it("pré-carrega no hover do CTA de entrar", async () => {
    const { dashboardPreloader, dashboardLoader } = renderShell("/");

    fireEvent.mouseOver(await screen.findByRole("link", { name: "Entrar" }));

    expect(dashboardPreloader).toHaveBeenCalled();
    // Pré-carregar não renderiza o remote.
    expect(dashboardLoader).not.toHaveBeenCalled();
  });

  it("pré-carrega no foco do botão de envio do login", async () => {
    const { dashboardPreloader } = renderShell("/login");

    fireEvent.focus(await screen.findByRole("button", { name: "Entrar" }));

    expect(dashboardPreloader).toHaveBeenCalled();
  });

  it("pré-carrega quando o login tem sucesso", async () => {
    const { dashboardPreloader, rerender } = renderShell("/login");

    await screen.findByRole("button", { name: "Entrar" });
    expect(dashboardPreloader).not.toHaveBeenCalled();

    mockAuth({ name: "Fulano", email: "email@teste.com" });
    rerender(
      <App
        pathname="/login"
        institutionalLoader={async () => InstitutionalRemote}
        dashboardPreloader={dashboardPreloader}
      />,
    );

    expect(dashboardPreloader).toHaveBeenCalledTimes(1);
  });
});
