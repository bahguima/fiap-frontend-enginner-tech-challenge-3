import { Suspense } from "react";
import type { IDashboardAppProps } from "./interface";
import { LanguageProvider } from "@dashboard/contexts/LanguageContext";
import { ThemeProvider } from "@dashboard/contexts/ThemeContext";
import { TransactionUseCasesProvider } from "@dashboard/features/transactions/di/TransactionUseCasesProvider";
import { PageFallback } from "@dashboard/components/dashboard/PageFallback";
import {
  dashboardPages,
  resolveDashboardRoute,
} from "@dashboard/routes/dashboardRoutes";
import DashboardLayout from "@dashboard/views/dashboard/DashboardLayout";
import { GlobalStyle } from "@dashboard/styles/global";
import { DashboardRoot } from "./styled";

export const DashboardApp = ({
  pathname = window.location.pathname,
  loginUrl = "/login",
  "data-testid": dataTestId,
}: IDashboardAppProps) => {
  // Cada página é um chunk carregado sob demanda; o layout (sidebar e
  // cabeçalho) permanece visível enquanto o fallback ocupa a área principal.
  const Page = dashboardPages[resolveDashboardRoute(pathname)];

  return (
    <ThemeProvider>
      <LanguageProvider>
        <GlobalStyle />
        <DashboardRoot data-testid={dataTestId}>
          <TransactionUseCasesProvider>
            <DashboardLayout loginUrl={loginUrl}>
              <Suspense fallback={<PageFallback />}>
                <Page />
              </Suspense>
            </DashboardLayout>
          </TransactionUseCasesProvider>
        </DashboardRoot>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default DashboardApp;
