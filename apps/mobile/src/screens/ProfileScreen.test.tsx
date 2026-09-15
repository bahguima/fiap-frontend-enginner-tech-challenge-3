import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { useAuth } from "@mobile/providers/AuthContext";
import { renderWithTheme } from "@mobile/test/render";
import { ProfileScreen } from "./ProfileScreen";

jest.mock("@mobile/providers/AuthContext", () => ({ useAuth: jest.fn() }));

const mockUseAuth = jest.mocked(useAuth);

describe("ProfileScreen", () => {
  it("encerra a sessão pela ação de logout", async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isInitializing: false,
      login: jest.fn(),
      logout,
      session: {
        displayName: "Cliente ByteBank",
        email: "demo@bytebank.test",
        uid: "demo-user",
      } as never,
    });
    renderWithTheme(<ProfileScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Sair da conta" }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it("permite tentar o logout novamente após falha", async () => {
    const logout = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    mockUseAuth.mockReturnValue({
      isInitializing: false,
      login: jest.fn(),
      logout,
      session: null,
    });
    renderWithTheme(<ProfileScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Sair da conta" }));
    expect(
      await screen.findByText(
        "Não foi possível sair da conta. Verifique sua conexão e tente novamente.",
      ),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole("button", { name: "Sair da conta" }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(2));
  });
});
