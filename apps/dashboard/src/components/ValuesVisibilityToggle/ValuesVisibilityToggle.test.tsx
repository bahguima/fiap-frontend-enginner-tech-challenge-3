import { fireEvent, render, screen } from "@testing-library/react";
import { TrendingUp } from "lucide-react";
import { FinancialMetricCard } from "@dashboard/components/dashboard/FinancialMetricCard";
import { MASKED_VALUE } from "@dashboard/components/SensitiveValue";
import { LanguageProvider } from "@dashboard/contexts/LanguageContext";
import { ValuesVisibilityProvider } from "@dashboard/contexts/ValuesVisibilityContext";
import { ValuesVisibilityToggle } from ".";

const metric = {
  label: "Saldo Total",
  amount: { value: 12740.57, formattedValue: "R$ 12.740,57" },
  comparisonText: "+2,5% em relação ao período anterior",
  comparisonTone: "positive" as const,
};

describe("Ocultar valores", () => {
  it("mascara os valores monetários e anuncia o estado do botão", () => {
    render(
      <LanguageProvider>
        <ValuesVisibilityProvider>
          <ValuesVisibilityToggle />
          <FinancialMetricCard metric={metric} icon={TrendingUp} tone="primary" />
        </ValuesVisibilityProvider>
      </LanguageProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Ocultar valores" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("R$ 12.740,57")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("R$ 12.740,57")).not.toBeInTheDocument();
    expect(screen.getByText(MASKED_VALUE)).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Valor oculto")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("R$ 12.740,57")).toBeInTheDocument();
  });
});
