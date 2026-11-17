import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "@banking/shared/auth";
import { IdleSessionGuard } from ".";

jest.mock("@banking/shared/auth", () => ({
  useAuth: jest.fn(),
}));

// Temporizadores reais (o useIdle usa RxJS): folga para a execução paralela
// do Nx, em que o padrão de 5 s por teste pode estourar.
jest.setTimeout(20_000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockAuth = (authenticated: boolean) => {
  const logout = jest.fn(async () => {});
  jest.mocked(useAuth).mockReturnValue({
    user: authenticated ? { name: "Fulano", email: "email@teste.com" } : null,
    isLoading: false,
    sessionEndReason: null,
    login: jest.fn(async () => ({ status: "authenticated" as const })),
    logout,
  });
  return logout;
};

describe("IdleSessionGuard", () => {
  it("avisa em um diálogo acessível e encerra a sessão por inatividade", async () => {
    const logout = mockAuth(true);
    render(<IdleSessionGuard warningAfterMs={50} countdownSeconds={1} />);

    const dialog = await screen.findByRole("alertdialog", {
      name: "Sua sessão está prestes a expirar",
    });
    expect(dialog).toHaveAccessibleDescription(
      /desconectado por inatividade em 0:0[01]/,
    );
    expect(screen.getByRole("timer")).toHaveTextContent(/0:0[01]/);
    // Foco inicial na ação segura.
    expect(
      screen.getByRole("button", { name: "Continuar conectado" }),
    ).toHaveFocus();

    // Atividade comum (mover o mouse) não fecha o aviso: exige ação explícita.
    fireEvent.mouseMove(window);
    expect(dialog).toBeInTheDocument();

    await waitFor(() => expect(logout).toHaveBeenCalledWith("idle"), {
      timeout: 8000,
    });
  });

  it("mantém a sessão e reinicia a contagem ao continuar conectado", async () => {
    const logout = mockAuth(true);
    render(<IdleSessionGuard warningAfterMs={500} countdownSeconds={1} />);

    // Clique sem mousedown/keydown (como na ativação por leitor de tela).
    fireEvent.click(
      await screen.findByRole("button", { name: "Continuar conectado" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await sleep(250);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    // Sem nova atividade, o aviso volta após outro período de inatividade.
    expect(
      await screen.findByRole("alertdialog", {}, { timeout: 8000 }),
    ).toBeInTheDocument();
  });

  it("permite sair imediatamente pelo aviso", async () => {
    const logout = mockAuth(true);
    render(<IdleSessionGuard warningAfterMs={50} countdownSeconds={30} />);

    fireEvent.click(await screen.findByRole("button", { name: "Sair agora" }));

    expect(logout).toHaveBeenCalledWith("logout");
  });

  it("não observa inatividade sem sessão", async () => {
    const logout = mockAuth(false);
    render(<IdleSessionGuard warningAfterMs={10} countdownSeconds={1} />);

    await sleep(100);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it("usa NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS e NEXT_PUBLIC_IDLE_WARNING_SECONDS sem props", async () => {
    process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS = "2";
    process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS = "1";
    const logout = mockAuth(true);
    const startedAt = Date.now();

    try {
      render(<IdleSessionGuard />);

      // Aviso em 2 - 1 = 1 s, com contagem de 1 s; logout em ~2 s.
      expect(
        await screen.findByRole("alertdialog", {}, { timeout: 8000 }),
      ).toBeInTheDocument();
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(900);
      expect(screen.getByRole("timer")).toHaveTextContent(/0:0[01]/);

      await waitFor(() => expect(logout).toHaveBeenCalledWith("idle"), {
        timeout: 8000,
      });
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1900);
    } finally {
      delete process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS;
      delete process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS;
    }
  });
});
