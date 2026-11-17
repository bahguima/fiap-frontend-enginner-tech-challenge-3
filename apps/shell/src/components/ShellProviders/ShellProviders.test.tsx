import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@banking/shared/auth";
import { getShellQueryClient, ShellProviders } from ".";

const QueryClientProbe = () => {
  const queryClient = useQueryClient();

  return (
    <p>
      {queryClient === getShellQueryClient()
        ? "QueryClient do shell"
        : "QueryClient inesperado"}
    </p>
  );
};

const AuthProbe = () => {
  const { login, user } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);

  const handleLogin = async () => {
    const result = await login("email@teste.com", "123");
    setAuthenticated(result.status === "authenticated");
  };

  return (
    <section aria-label="Autenticação compartilhada">
      <p>{authenticated && user !== null ? user.name : "Sem sessão"}</p>
      <button type="button" onClick={handleLogin}>
        Autenticar
      </button>
    </section>
  );
};

describe("ShellProviders", () => {
  it("oferece a única instância do QueryClient criada pelo shell", () => {
    render(
      <ShellProviders>
        <QueryClientProbe />
      </ShellProviders>,
    );

    expect(screen.getByText("QueryClient do shell")).toBeInTheDocument();
  });

  it("oferece uma única origem de autenticação aos consumidores", async () => {
    render(
      <ShellProviders>
        <AuthProbe />
      </ShellProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Autenticar" }));

    expect(await screen.findByText("Fulano")).toBeInTheDocument();
  });
});
