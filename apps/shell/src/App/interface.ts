import type { RemoteComponentLoader } from "../components/RemoteSlot/interface";

export interface IAppProps {
  pathname?: string;
  institutionalLoader?: RemoteComponentLoader;
  dashboardLoader?: RemoteComponentLoader;
  /** Pré-carrega o remote do dashboard (login com sucesso, hover/foco em "Entrar"). */
  dashboardPreloader?: () => void;
  "data-testid"?: string;
}
