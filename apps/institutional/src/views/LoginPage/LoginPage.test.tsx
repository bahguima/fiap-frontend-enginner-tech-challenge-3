import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@banking/shared/auth";
import { createQueryClient } from "@banking/shared/query";
import { signOutTestSession } from "@banking/shared/testing/testSession";
import { LanguageProvider } from "@institutional/contexts/LanguageContext";
import LoginPage from ".";

function renderLoginPage() {
  const queryClient = createQueryClient({ queries: { retry: false } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
  render(<LoginPage />, { wrapper });
  return queryClient;
}

async function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  return screen.findByRole("alert");
}

describe("LoginPage – bloqueio por tentativas inválidas", () => {
  beforeEach(() => {
    signOutTestSession();
  });

  it("informa as tentativas restantes e o bloqueio de forma acessível", async () => {
    const queryClient = renderLoginPage();

    const firstError = await submit("email@teste.com", "errada");
    expect(firstError).toHaveTextContent(
      "E-mail ou senha inválidos. Tentativas restantes antes do bloqueio: 4.",
    );
    expect(screen.getByLabelText("Senha")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Senha")).toHaveAccessibleDescription(
      firstError.textContent ?? "",
    );

    for (let attempt = 2; attempt <= 4; attempt += 1) {
      await submit("email@teste.com", `errada-${attempt}`);
    }
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tentativas restantes antes do bloqueio: 1.",
    );

    const locked = await submit("email@teste.com", "errada-5");
    expect(locked).toHaveTextContent(
      "Muitas tentativas inválidas. Por segurança, o acesso foi bloqueado. Tente novamente em 15 minutos.",
    );

    // Bloqueado: nem a senha correta entra.
    const stillLocked = await submit("email@teste.com", "123");
    expect(stillLocked).toHaveTextContent("o acesso foi bloqueado");
    expect(window.location.pathname).not.toBe("/dashboard");
    queryClient.clear();
  });
});

describe("LoginPage – sessão encerrada por inatividade", () => {
  const IdleLogoutTrigger = () => {
    const { logout } = useAuth();
    return (
      <button type="button" onClick={() => void logout("idle")}>
        Simular inatividade
      </button>
    );
  };

  function renderWithTrigger() {
    const queryClient = createQueryClient({ queries: { retry: false } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <IdleLogoutTrigger />
            <LoginPage />
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>,
    );
    return queryClient;
  }

  it("informa o logout por inatividade com role=status e some no novo login", async () => {
    const queryClient = renderWithTrigger();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Simular inatividade" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sessão encerrada por inatividade",
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "email@teste.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    queryClient.clear();
  });

  it("não mostra o aviso quando o logout é voluntário", async () => {
    const queryClient = createQueryClient({ queries: { retry: false } });
    const LogoutTrigger = () => {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={() => void logout()}>
          Sair
        </button>
      );
    };
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <LogoutTrigger />
            <LoginPage />
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    queryClient.clear();
  });
});
