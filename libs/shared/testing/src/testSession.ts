import { authSession } from "@banking/shared/api-client";
import { createMockSession, resetMockAuthState } from "./mocks/authState";
import { mockAuthUser } from "./mocks/fixtures/auth";

/**
 * Inicia uma sessão de teste: cria a sessão no mock (cookie de refresh
 * simulado) e aplica a concessão no store em memória do cliente.
 */
export function signInTestSession() {
  const grant = createMockSession(mockAuthUser);
  authSession.reset();
  authSession.applyGrant(grant, "login");
  return grant;
}

/** Volta ao estado anônimo: sem token em memória e sem cookies no mock. */
export function signOutTestSession() {
  authSession.reset();
  resetMockAuthState();
}
