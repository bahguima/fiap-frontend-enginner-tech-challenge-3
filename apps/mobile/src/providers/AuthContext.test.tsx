import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { createTestAuthAdapter, testSession } from "@mobile/test/auth";
import { AuthProvider, useAuth } from "./AuthContext";

describe("AuthContext", () => {
  it("mantém o loading inicial até restaurar a sessão persistida", async () => {
    const adapter = createTestAuthAdapter(null, {
      deferInitialSession: true,
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthProvider adapter={adapter}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isInitializing).toBe(true);
    expect(result.current.session).toBeNull();

    act(() => adapter.emitSession(testSession));

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.session).toBe(testSession);
    });
  });

  it("encaminha o login válido ao adaptador de autenticação", async () => {
    const adapter = createTestAuthAdapter();
    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthProvider adapter={adapter}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: "cliente@bytebank.test",
        password: "senha-segura",
      });
    });

    expect(adapter.login).toHaveBeenCalledWith({
      email: "cliente@bytebank.test",
      password: "senha-segura",
    });
  });

  it("encerra a sessão no logout", async () => {
    const adapter = createTestAuthAdapter(testSession);
    adapter.logout.mockImplementation(async () => {
      adapter.emitSession(null);
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthProvider adapter={adapter}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.session).toBe(testSession));

    await act(async () => {
      await result.current.logout();
    });

    expect(adapter.logout).toHaveBeenCalledTimes(1);
    expect(result.current.session).toBeNull();
  });
});
