import "@testing-library/jest-dom";
import { resetMockState } from "../mocks/state";
import { server } from "../mocks/server";
import { signInTestSession, signOutTestSession } from "../testSession";

process.env.NEXT_PUBLIC_API_MOCK_DELAY_MS = "0";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Por padrão cada teste começa autenticado (access token em memória e cookie
// de refresh simulado), como um usuário que já entrou no dashboard. Testes
// do fluxo anônimo chamam `signOutTestSession()`.
beforeEach(() => {
  signInTestSession();
});

afterEach(() => {
  server.resetHandlers();
  signOutTestSession();
  resetMockState();
});

afterAll(() => {
  server.close();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
