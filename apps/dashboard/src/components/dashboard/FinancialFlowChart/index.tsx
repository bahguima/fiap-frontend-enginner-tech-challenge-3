import type { IFinancialFlowChartProps } from "./interface";
import {
  AccessibleTable,
  Bar,
  Bars,
  FlowHeader,
  FlowRoot,
  FlowTitle,
  Legend,
  LegendItem,
  Period,
  PeriodLabel,
  Plot,
} from "./styled";
import { SensitiveValue } from "@dashboard/components/SensitiveValue";

export const FinancialFlowChart = ({
  cashFlow,
  "data-testid": dataTestId,
}: IFinancialFlowChartProps) => (
  <FlowRoot data-testid={dataTestId} aria-labelledby="financial-flow-title">
    <FlowHeader>
      <FlowTitle id="financial-flow-title">{cashFlow.title}</FlowTitle>
      <Legend aria-label="Legenda do gráfico">
        <LegendItem>Receitas</LegendItem>
        <LegendItem $expense>Despesas</LegendItem>
      </Legend>
    </FlowHeader>

    <Plot aria-hidden="true">
      <Period>
        <Bars>
          <Bar $height={cashFlow.firstPeriod.incomeHeight} />
          <Bar $height={cashFlow.firstPeriod.expenseHeight} $expense />
        </Bars>
        <PeriodLabel>{cashFlow.firstPeriod.label}</PeriodLabel>
      </Period>
      <Period>
        <Bars>
          <Bar $height={cashFlow.secondPeriod.incomeHeight} />
          <Bar $height={cashFlow.secondPeriod.expenseHeight} $expense />
        </Bars>
        <PeriodLabel>{cashFlow.secondPeriod.label}</PeriodLabel>
      </Period>
      <Period>
        <Bars>
          <Bar $height={cashFlow.thirdPeriod.incomeHeight} />
          <Bar $height={cashFlow.thirdPeriod.expenseHeight} $expense />
        </Bars>
        <PeriodLabel>{cashFlow.thirdPeriod.label}</PeriodLabel>
      </Period>
      <Period>
        <Bars>
          <Bar $height={cashFlow.fourthPeriod.incomeHeight} />
          <Bar $height={cashFlow.fourthPeriod.expenseHeight} $expense />
        </Bars>
        <PeriodLabel>{cashFlow.fourthPeriod.label}</PeriodLabel>
      </Period>
      <Period>
        <Bars>
          <Bar $height={cashFlow.fifthPeriod.incomeHeight} />
          <Bar $height={cashFlow.fifthPeriod.expenseHeight} $expense />
        </Bars>
        <PeriodLabel>{cashFlow.fifthPeriod.label}</PeriodLabel>
      </Period>
      <Period>
        <Bars>
          <Bar $height={cashFlow.sixthPeriod.incomeHeight} />
          <Bar $height={cashFlow.sixthPeriod.expenseHeight} $expense />
        </Bars>
        <PeriodLabel>{cashFlow.sixthPeriod.label}</PeriodLabel>
      </Period>
    </Plot>

    <AccessibleTable>
      <caption>{cashFlow.accessibleDescription}</caption>
      <thead>
        <tr>
          <th scope="col">Período</th>
          <th scope="col">Receitas</th>
          <th scope="col">Despesas</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">{cashFlow.firstPeriod.label}</th>
          <td><SensitiveValue>{cashFlow.firstPeriod.income.formattedValue}</SensitiveValue></td>
          <td><SensitiveValue>{cashFlow.firstPeriod.expense.formattedValue}</SensitiveValue></td>
        </tr>
        <tr>
          <th scope="row">{cashFlow.secondPeriod.label}</th>
          <td><SensitiveValue>{cashFlow.secondPeriod.income.formattedValue}</SensitiveValue></td>
          <td><SensitiveValue>{cashFlow.secondPeriod.expense.formattedValue}</SensitiveValue></td>
        </tr>
        <tr>
          <th scope="row">{cashFlow.thirdPeriod.label}</th>
          <td><SensitiveValue>{cashFlow.thirdPeriod.income.formattedValue}</SensitiveValue></td>
          <td><SensitiveValue>{cashFlow.thirdPeriod.expense.formattedValue}</SensitiveValue></td>
        </tr>
        <tr>
          <th scope="row">{cashFlow.fourthPeriod.label}</th>
          <td><SensitiveValue>{cashFlow.fourthPeriod.income.formattedValue}</SensitiveValue></td>
          <td><SensitiveValue>{cashFlow.fourthPeriod.expense.formattedValue}</SensitiveValue></td>
        </tr>
        <tr>
          <th scope="row">{cashFlow.fifthPeriod.label}</th>
          <td><SensitiveValue>{cashFlow.fifthPeriod.income.formattedValue}</SensitiveValue></td>
          <td><SensitiveValue>{cashFlow.fifthPeriod.expense.formattedValue}</SensitiveValue></td>
        </tr>
        <tr>
          <th scope="row">{cashFlow.sixthPeriod.label}</th>
          <td><SensitiveValue>{cashFlow.sixthPeriod.income.formattedValue}</SensitiveValue></td>
          <td><SensitiveValue>{cashFlow.sixthPeriod.expense.formattedValue}</SensitiveValue></td>
        </tr>
      </tbody>
    </AccessibleTable>
  </FlowRoot>
);
