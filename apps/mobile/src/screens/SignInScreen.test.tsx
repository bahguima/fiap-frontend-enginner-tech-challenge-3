import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { AuthProvider } from "@mobile/providers/AuthContext";
import { createTestAuthAdapter } from "@mobile/test/auth";
import { renderWithTheme } from "@mobile/test/render";
import { SignInScreen } from "./SignInScreen";

function fillCredentials() {
  fireEvent.changeText(
    screen.getByLabelText("E-mail"),
    "cliente@bytebank.test",
  );
  fireEvent.changeText(screen.getByLabelText("Senha"), "senha-segura");
}

describe("SignInScreen", () => {
  it("envia um login válido e apresenta o estado de carregamento", async () => {
    let finishLogin: () => void = () => undefined;
    const adapter = createTestAuthAdapter();
    adapter.login.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishLogin = resolve;
        }),
    );
    renderWithTheme(
      <AuthProvider adapter={adapter}>
        <SignInScreen />
      </AuthProvider>,
    );

    fillCredentials();
    fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Entrando" }),
      ).toBeDisabled();
      expect(screen.getByText("Entrando...")).toBeOnTheScreen();
    });
    expect(adapter.login).toHaveBeenCalledWith({
      email: "cliente@bytebank.test",
      password: "senha-segura",
    });

    await act(async () => finishLogin());
  });

  it("explica o erro de credenciais inválidas", async () => {
    const adapter = createTestAuthAdapter();
    adapter.login.mockRejectedValue(
      Object.assign(new Error("invalid credential"), {
        code: "auth/invalid-credential",
      }),
    );
    renderWithTheme(
      <AuthProvider adapter={adapter}>
        <SignInScreen />
      </AuthProvider>,
    );

    fillCredentials();
    fireEvent.press(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText(
        "E-mail ou senha incorretos. Confira os dados e tente novamente.",
      ),
    ).toBeOnTheScreen();
  });

  it("configura teclado e autofill adequados para as credenciais", () => {
    const adapter = createTestAuthAdapter();
    renderWithTheme(
      <AuthProvider adapter={adapter}>
        <SignInScreen />
      </AuthProvider>,
    );

    expect(screen.getByLabelText("E-mail")).toHaveProp(
      "keyboardType",
      "email-address",
    );
    expect(screen.getByLabelText("E-mail")).toHaveProp("autoComplete", "email");
    expect(screen.getByLabelText("Senha")).toHaveProp(
      "autoComplete",
      "current-password",
    );
    expect(screen.getByLabelText("Senha")).toHaveProp("secureTextEntry", true);
  });

  it("preenche somente a conta pública do Emulator Suite", () => {
    const adapter = createTestAuthAdapter();
    renderWithTheme(
      <AuthProvider adapter={adapter}>
        <SignInScreen />
      </AuthProvider>,
    );

    fireEvent.press(
      screen.getByRole("button", {
        name: "Preencher acesso de demonstração",
      }),
    );

    expect(screen.getByLabelText("E-mail")).toHaveProp(
      "value",
      "demo@bytebank.test",
    );
    expect(screen.getByLabelText("Senha")).toHaveProp(
      "value",
      "ByteBank123!",
    );
  });
});
