import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@banking/shared/auth";
import { createQueryClient } from "@banking/shared/query";
import { IdleSessionGuard } from "../IdleSessionGuard";
import type { IShellProvidersProps } from "./interface";
import { ProvidersRoot } from "./styled";

const shellQueryClient = createQueryClient();

export const getShellQueryClient = () => shellQueryClient;

export const ShellProviders = ({
  children,
  "data-testid": dataTestId,
}: IShellProvidersProps) => (
  <QueryClientProvider client={shellQueryClient}>
    <AuthProvider>
      <ProvidersRoot data-testid={dataTestId}>{children}</ProvidersRoot>
      <IdleSessionGuard />
    </AuthProvider>
  </QueryClientProvider>
);
