import { useEffect, useRef, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import { useAuth } from "@banking/shared/auth";
import { RemoteSlot } from "../components/RemoteSlot";
import {
  loadRemoteComponent,
  loadRemoteComponentOnce,
  preloadDashboard,
} from "../mf";
import type { IAppProps } from "./interface";
import { ShellMain } from "./styled";

const loadInstitutional = () =>
  loadRemoteComponent("institutional", "App");

// Reaproveita o carregamento iniciado pelo pré-carregamento, se houver.
const loadDashboard = () => loadRemoteComponentOnce("dashboard", "App");

/**
 * Indica intenção de entrar no dashboard: links para `/login` ou
 * `/dashboard/*` (CTAs "Entrar") e o botão de envio do formulário de login.
 */
const isDashboardIntentTarget = (
  target: EventTarget,
  activePathname: string,
) => {
  if (!(target instanceof Element)) return false;

  const anchor = target.closest("a");

  if (anchor !== null) {
    return (
      anchor.origin === window.location.origin &&
      (anchor.pathname === "/login" || anchor.pathname.startsWith("/dashboard"))
    );
  }

  return (
    activePathname === "/login" &&
    target.closest('button[type="submit"]') !== null
  );
};

export const App = ({
  pathname,
  institutionalLoader = loadInstitutional,
  dashboardLoader = loadDashboard,
  dashboardPreloader = preloadDashboard,
  "data-testid": dataTestId,
}: IAppProps) => {
  const initialPathname = useRef(
    pathname ?? window.location.pathname,
  );
  const [activePathname, setActivePathname] = useState(
    initialPathname.current,
  );
  const { user, isLoading } = useAuth();
  const isDashboardRoute = activePathname.startsWith("/dashboard");
  const canLoadDashboard = isDashboardRoute && user !== null;

  useEffect(() => {
    if (pathname !== undefined) {
      setActivePathname(pathname);
      return;
    }

    const handleLocationChange = () => {
      setActivePathname(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (
      pathname !== undefined ||
      isLoading ||
      user !== null ||
      !initialPathname.current.startsWith("/dashboard") ||
      !activePathname.startsWith("/dashboard")
    ) {
      return;
    }

    window.history.replaceState({}, "", "/login");
    setActivePathname("/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [activePathname, isLoading, pathname, user]);

  // Login com sucesso (ou sessão restaurada fora do dashboard): a próxima
  // rota provável é o dashboard, então o remote começa a ser baixado já.
  useEffect(() => {
    if (user !== null && !isDashboardRoute) {
      dashboardPreloader();
    }
  }, [dashboardPreloader, isDashboardRoute, user]);

  const handleDashboardIntent = (event: SyntheticEvent<HTMLElement>) => {
    if (isDashboardRoute) return;

    if (isDashboardIntentTarget(event.target, activePathname)) {
      dashboardPreloader();
    }
  };

  const handleNavigation = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) return;

    const anchor = event.target.closest("a");

    if (
      anchor === null ||
      anchor.target === "_blank" ||
      anchor.origin !== window.location.origin
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", anchor.href);
    setActivePathname(anchor.pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <ShellMain
      data-testid={dataTestId}
      onClick={handleNavigation}
      onMouseOver={handleDashboardIntent}
      onFocus={handleDashboardIntent}
    >
      {isDashboardRoute && isLoading ? (
        <p role="status">Verificando sessão...</p>
      ) : canLoadDashboard ? (
        <RemoteSlot
          name="Dashboard"
          loadComponent={dashboardLoader}
          pathname={activePathname}
        />
      ) : (
        <RemoteSlot
          name="Institucional"
          loadComponent={institutionalLoader}
          pathname={isDashboardRoute ? "/login" : activePathname}
        />
      )}
    </ShellMain>
  );
};

export default App;
