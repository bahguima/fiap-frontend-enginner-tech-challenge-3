import { fireEvent, screen } from "@testing-library/react-native";

import { createDashboardPeriod } from "@mobile/features/dashboard/data/selectors";
import { renderWithTheme } from "@mobile/test/render";
import { DashboardScreen } from "./DashboardScreen";

const mockUseDashboard = jest.fn();

jest.mock("@mobile/providers/AuthContext", () => ({
  useAuth: () => ({ session: { uid: "uid-1", displayName: "Maria Silva" } }),
}));
jest.mock("@mobile/features/dashboard/hooks/useDashboard", () => ({
  useDashboard: () => mockUseDashboard(),
}));
jest.mock("@mobile/features/dashboard/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));
jest.mock("react-native-gifted-charts", () => ({
  BarChart: () => {
    // Jest requires lazy CommonJS imports inside the hoisted mock factory.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactModule = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View: NativeView } = require("react-native");
    return ReactModule.createElement(NativeView, { testID: "gifted-bar-chart" });
  },
  PieChart: () => {
    // Jest requires lazy CommonJS imports inside the hoisted mock factory.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactModule = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View: NativeView } = require("react-native");
    return ReactModule.createElement(NativeView, { testID: "gifted-pie-chart" });
  },
}));

const period = createDashboardPeriod(new Date(2026, 8, 14));
const transaction = {
  id: "tx-1",
  description: "Depósito de salário",
  observation: "",
  amountInCents: 890_000,
  type: "income" as const,
  categoryId: "salary",
  category: "Salário",
  date: "2026-09-10",
  status: "completed" as const,
  attachmentCount: 0,
};

function successfulDashboard() {
  return {
    period,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn().mockResolvedValue([]),
    summary: {
      data: {
        balance: {
          label: "Saldo",
          valueInCents: 1_274_057,
          formattedValue: "R$ 12.740,57",
          comparisonText: "18,4% acima do mês anterior",
          comparisonTone: "positive",
        },
        totalIncome: {
          label: "Entradas",
          valueInCents: 1_746_800,
          formattedValue: "R$ 17.468,00",
          comparisonText: "10,3% acima do mês anterior",
          comparisonTone: "positive",
        },
        totalExpense: {
          label: "Saídas",
          valueInCents: 472_743,
          formattedValue: "R$ 4.727,43",
          comparisonText: "8,1% abaixo do mês anterior",
          comparisonTone: "positive",
        },
        transactionCount: 8,
      },
    },
    monthly: {
      data: period.months.map((month, index) => ({
        month,
        incomeInCents: (index + 1) * 100_000,
        expenseInCents: (index + 1) * 50_000,
        formattedIncome: `R$ ${index + 1}.000,00`,
        formattedExpense: `R$ ${index + 1}00,00`,
      })),
    },
    categories: {
      data: [
        {
          categoryId: "housing",
          category: "Moradia",
          amountInCents: 179_642,
          formattedAmount: "R$ 1.796,42",
          percentage: 38,
          formattedPercentage: "38%",
          color: "#0E7F84",
        },
      ],
    },
    recent: { data: [transaction] },
  };
}

describe("DashboardScreen", () => {
  beforeEach(() => {
    mockUseDashboard.mockReturnValue(successfulDashboard());
  });

  it("renders indicators, charts and recent transactions", () => {
    renderWithTheme(<DashboardScreen />);

    expect(screen.getByRole("header", { name: "Olá, Maria" })).toBeOnTheScreen();
    expect(screen.getByLabelText(/Saldo: R\$ 12\.740,57/)).toBeOnTheScreen();
    expect(screen.getByTestId("monthly-chart")).toBeOnTheScreen();
    expect(screen.getByTestId("category-chart")).toBeOnTheScreen();
    expect(screen.getByText("Depósito de salário")).toBeOnTheScreen();
  });

  it("expands the textual and tabular chart alternatives", () => {
    renderWithTheme(<DashboardScreen />);

    fireEvent.press(
      screen.getByRole("button", { name: "Exibir tabela da evolução mensal" }),
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Exibir tabela da distribuição por categoria" }),
    );

    expect(screen.getAllByText("Entradas").length).toBeGreaterThan(1);
    expect(screen.getByLabelText("Moradia, R$ 1.796,42, 38%")).toBeOnTheScreen();
  });

  it("handles loading, error with retry, and empty query states", () => {
    const retry = jest.fn().mockResolvedValue([]);
    mockUseDashboard.mockReturnValue({
      ...successfulDashboard(),
      isPending: true,
    });
    const view = renderWithTheme(<DashboardScreen />);
    expect(screen.getByText("Carregando seus indicadores financeiros...")).toBeOnTheScreen();
    view.unmount();

    mockUseDashboard.mockReturnValue({
      ...successfulDashboard(),
      isError: true,
      refetch: retry,
    });
    const errorView = renderWithTheme(<DashboardScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledTimes(1);
    errorView.unmount();

    const empty = successfulDashboard();
    empty.summary.data.transactionCount = 0;
    mockUseDashboard.mockReturnValue(empty);
    renderWithTheme(<DashboardScreen />);
    expect(screen.getByText("Ainda não há dados financeiros")).toBeOnTheScreen();
  });

  it("runs quick actions and pull to refresh", () => {
    const data = successfulDashboard();
    mockUseDashboard.mockReturnValue(data);
    const onAddTransaction = jest.fn();
    renderWithTheme(<DashboardScreen onAddTransaction={onAddTransaction} />);

    fireEvent.press(screen.getByRole("button", { name: "Adicionar" }));
    screen.getByTestId("dashboard-scroll").props.refreshControl.props.onRefresh();

    expect(onAddTransaction).toHaveBeenCalledTimes(1);
    expect(data.refetch).toHaveBeenCalledTimes(1);
  });
});
