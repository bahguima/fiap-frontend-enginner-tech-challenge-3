import type { ComponentType } from "react";
import { loadRemote } from "@module-federation/enhanced/runtime";
import type { IRemoteAppProps } from "./components/RemoteSlot/interface";

interface IRemoteModule {
  default: ComponentType<IRemoteAppProps>;
}

type RemoteAlias = "institutional" | "dashboard";

export const loadRemoteComponent = async (
  alias: RemoteAlias,
  exposeName: string,
) => {
  const remoteModule = await loadRemote<IRemoteModule>(
    `${alias}/${exposeName}`,
  );

  if (remoteModule === null || remoteModule === undefined) {
    throw new Error(`O remote ${alias}/${exposeName} não foi encontrado.`);
  }

  return remoteModule.default;
};

const pendingRemotes = new Map<
  string,
  Promise<ComponentType<IRemoteAppProps>>
>();

/**
 * Carrega (uma única vez) o `remoteEntry.js` e os chunks do expose.
 *
 * O pré-carregamento em intenção do usuário e a renderização da rota
 * compartilham a mesma promessa, então o remote já está pronto quando a
 * navegação acontece. Falhas descartam a promessa para permitir nova
 * tentativa (botão "Tentar novamente" do `RemoteSlot`).
 */
export const loadRemoteComponentOnce = (
  alias: RemoteAlias,
  exposeName: string,
) => {
  const key = `${alias}/${exposeName}`;
  let pending = pendingRemotes.get(key);

  if (pending === undefined) {
    pending = loadRemoteComponent(alias, exposeName).catch((error: unknown) => {
      pendingRemotes.delete(key);
      throw error;
    });
    pendingRemotes.set(key, pending);
  }

  return pending;
};

/** Pré-carrega o remote do dashboard sem renderizá-lo. Nunca lança. */
export const preloadDashboard = () => {
  void loadRemoteComponentOnce("dashboard", "App").catch(() => {
    // O erro reaparece, com nova tentativa, quando a rota for renderizada.
  });
};
