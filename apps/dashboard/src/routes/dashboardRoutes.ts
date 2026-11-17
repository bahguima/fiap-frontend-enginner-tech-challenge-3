import { lazyWithPreload } from "@dashboard/lib/lazyWithPreload";

/**
 * Registro das rotas internas do dashboard.
 *
 * Cada página vira um chunk próprio (`React.lazy`), carregado somente quando a
 * rota é renderizada ou quando o usuário demonstra intenção de navegar
 * (hover/foco no link da sidebar, via `preload()`).
 */
export const dashboardPages = {
  "/dashboard": lazyWithPreload(
    () => import("@dashboard/views/dashboard/OverviewPage"),
  ),
  "/dashboard/statement": lazyWithPreload(
    () => import("@dashboard/views/dashboard/StatementPage"),
  ),
  "/dashboard/income": lazyWithPreload(
    () => import("@dashboard/views/dashboard/IncomePage"),
  ),
  "/dashboard/expenses": lazyWithPreload(
    () => import("@dashboard/views/dashboard/ExpensesPage"),
  ),
  "/dashboard/profile": lazyWithPreload(
    () => import("@dashboard/views/dashboard/ProfilePage"),
  ),
};

export type DashboardRoutePath = keyof typeof dashboardPages;

export const DEFAULT_DASHBOARD_ROUTE: DashboardRoutePath = "/dashboard";

/** Rotas desconhecidas caem na visão geral, como antes do lazy loading. */
export function resolveDashboardRoute(pathname: string): DashboardRoutePath {
  return Object.prototype.hasOwnProperty.call(dashboardPages, pathname)
    ? (pathname as DashboardRoutePath)
    : DEFAULT_DASHBOARD_ROUTE;
}
