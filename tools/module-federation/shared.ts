import type { moduleFederationPlugin } from "@module-federation/sdk";

export const sharedDependencies: moduleFederationPlugin.Shared = {
  react: {
    singleton: true,
    requiredVersion: "^18.3.1",
  },
  "react-dom": {
    singleton: true,
    requiredVersion: "^18.3.1",
  },
  "styled-components": {
    singleton: true,
    requiredVersion: "^6.4.1",
  },
  "@tanstack/react-query": {
    singleton: true,
    requiredVersion: "^5.83.0",
  },
  "@banking/shared/auth": {
    singleton: true,
    requiredVersion: "0.0.0",
    version: "0.0.0",
  },
  // Estado global de sessão: access token e token anti-CSRF em memória e o
  // refresh single-flight. Precisa ser a mesma instância no shell e nos
  // remotes; os remotes importam somente a raiz do pacote (regra de lint).
  "@banking/shared/api-client": {
    singleton: true,
    requiredVersion: "0.0.0",
    version: "0.0.0",
  },
};
