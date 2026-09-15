import { Stack } from "expo-router";
import {
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from "expo-router/testing-library";
import { Pressable, Text } from "react-native";

import { AuthProvider, useAuth } from "@mobile/providers/AuthContext";
import { MobileThemeProvider } from "@mobile/theme/MobileThemeProvider";
import {
  createTestAuthAdapter,
  testSession,
  type TestAuthAdapter,
} from "@mobile/test/auth";
import { AuthenticatedNavigator } from "./AuthenticatedNavigator";

function PublicLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

function ProtectedLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

function SignInRoute() {
  const { login } = useAuth();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        login({ email: "cliente@bytebank.test", password: "senha-segura" })
      }
    >
      <Text>Entrar no teste</Text>
    </Pressable>
  );
}

function PrivateRoute() {
  const { logout } = useAuth();

  return (
    <>
      <Text>Conteúdo privado</Text>
      <Pressable accessibilityRole="button" onPress={logout}>
        <Text>Sair do teste</Text>
      </Pressable>
    </>
  );
}

function renderAuthRouter(adapter: TestAuthAdapter, initialUrl: string) {
  return renderRouter(
    {
      "_layout": () => (
        <MobileThemeProvider>
          <AuthProvider adapter={adapter}>
            <AuthenticatedNavigator />
          </AuthProvider>
        </MobileThemeProvider>
      ),
      "(protected)/_layout": ProtectedLayout,
      "(protected)/index": PrivateRoute,
      "(public)/_layout": PublicLayout,
      "(public)/sign-in": SignInRoute,
    },
    { initialUrl },
  );
}

describe("AuthenticatedNavigator", () => {
  it("protege a rota privada e redireciona a sessão anônima para o login", async () => {
    const adapter = createTestAuthAdapter();
    const router = renderAuthRouter(adapter, "/");

    await waitFor(() => expect(router.getPathname()).toBe("/sign-in"));

    expect(screen.getByText("Entrar no teste")).toBeOnTheScreen();
    expect(screen.queryByText("Conteúdo privado")).not.toBeOnTheScreen();
  });

  it("redireciona para a rota privada depois do login", async () => {
    const adapter = createTestAuthAdapter();
    adapter.login.mockImplementation(async () => {
      adapter.emitSession(testSession);
    });
    const router = renderAuthRouter(adapter, "/sign-in");

    await waitFor(() => expect(router.getPathname()).toBe("/sign-in"));
    fireEvent.press(screen.getByRole("button", { name: "Entrar no teste" }));

    await waitFor(() => expect(router.getPathname()).toBe("/"));
    expect(screen.getByText("Conteúdo privado")).toBeOnTheScreen();
  });

  it("redireciona para o login depois do logout", async () => {
    const adapter = createTestAuthAdapter(testSession);
    adapter.logout.mockImplementation(async () => {
      adapter.emitSession(null);
    });
    const router = renderAuthRouter(adapter, "/");

    await screen.findByText("Conteúdo privado");
    fireEvent.press(screen.getByRole("button", { name: "Sair do teste" }));

    await waitFor(() => expect(router.getPathname()).toBe("/sign-in"));
    expect(screen.getByText("Entrar no teste")).toBeOnTheScreen();
  });
});
