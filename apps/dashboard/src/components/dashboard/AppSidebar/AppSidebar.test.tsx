import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createQueryClient } from "@banking/shared/query";
import { server } from "@banking/shared/testing/mocks/server";
import { SidebarProvider } from "@banking/shared/ui/components/sidebar";
import { LanguageProvider } from "@dashboard/contexts/LanguageContext";
import { dashboardQueryKeys } from "@dashboard/features/dashboard/api/queryKeys";
import { transactionQueryKeys } from "@dashboard/features/transactions/api/queryKeys";
import { readTransactionSearchParams } from "@dashboard/features/transactions/hooks/useTransactionListSearchParams";
import { dashboardPages } from "@dashboard/routes/dashboardRoutes";
import { AppSidebar } from ".";

jest.mock("@banking/shared/auth", () => ({
  useAuth: () => ({
    user: { name: "Fulano", email: "email@teste.com" },
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

const renderSidebar = () => {
  const queryClient = createQueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );

  return queryClient;
};

/** Registra os caminhos de API requisitados (interceptados pelo MSW). */
const trackApiRequests = () => {
  const paths: string[] = [];
  const listener = ({ request }: { request: Request }) => {
    paths.push(new URL(request.url).pathname);
  };

  server.events.on("request:start", listener);

  return {
    paths,
    stop: () => server.events.removeListener("request:start", listener),
  };
};

describe("AppSidebar – prefetch em intenção do usuário", () => {
  let requests: ReturnType<typeof trackApiRequests>;

  beforeEach(() => {
    window.history.replaceState(null, "", "/dashboard");
    requests = trackApiRequests();
  });

  afterEach(() => {
    requests.stop();
    jest.restoreAllMocks();
  });

  it("pré-carrega o chunk e os dados do perfil no hover do link", async () => {
    const preload = jest
      .spyOn(dashboardPages["/dashboard/profile"], "preload")
      .mockResolvedValue({ default: () => null });
    const queryClient = renderSidebar();

    expect(requests.paths).not.toContain("/api/profile");

    fireEvent.mouseEnter(screen.getByRole("link", { name: "Perfil" }));

    expect(preload).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        queryClient.getQueryData(dashboardQueryKeys.profile()),
      ).toBeDefined(),
    );
    expect(requests.paths).toContain("/api/profile");
  });

  it("pré-carrega extrato e categorias ao focar o link pelo teclado", async () => {
    const preload = jest
      .spyOn(dashboardPages["/dashboard/statement"], "preload")
      .mockResolvedValue({ default: () => null });
    const queryClient = renderSidebar();

    fireEvent.focus(screen.getByRole("link", { name: "Extrato" }));

    expect(preload).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        queryClient.getQueryData(
          transactionQueryKeys.list(readTransactionSearchParams("")),
        ),
      ).toBeDefined();
      expect(
        queryClient.getQueryData(transactionQueryKeys.categories()),
      ).toBeDefined();
    });
  });

  it("não repete a requisição em hovers seguidos enquanto o dado está fresco", async () => {
    jest
      .spyOn(dashboardPages["/dashboard/profile"], "preload")
      .mockResolvedValue({ default: () => null });
    const queryClient = renderSidebar();
    const profileLink = screen.getByRole("link", { name: "Perfil" });

    fireEvent.mouseEnter(profileLink);
    await waitFor(() =>
      expect(
        queryClient.getQueryData(dashboardQueryKeys.profile()),
      ).toBeDefined(),
    );

    fireEvent.mouseLeave(profileLink);
    fireEvent.mouseEnter(profileLink);

    expect(
      requests.paths.filter((path) => path === "/api/profile"),
    ).toHaveLength(1);
  });
});
