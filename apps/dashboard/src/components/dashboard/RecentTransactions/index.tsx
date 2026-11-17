import type { IRecentTransactionsProps } from "./interface";
import {
  AmountCell,
  Cell,
  DescriptionCell,
  EmptyMessage,
  HeaderCell,
  MutedCell,
  RecentRoot,
  RecentTitle,
  TableWrap,
  TransactionsTable,
} from "./styled";
import { SensitiveValue } from "@dashboard/components/SensitiveValue";

export const RecentTransactions = ({
  recentTransactions,
  "data-testid": dataTestId,
}: IRecentTransactionsProps) => {
  const hasTransactions =
    recentTransactions.firstTransaction !== null ||
    recentTransactions.secondTransaction !== null ||
    recentTransactions.thirdTransaction !== null ||
    recentTransactions.fourthTransaction !== null ||
    recentTransactions.fifthTransaction !== null;

  return (
    <RecentRoot data-testid={dataTestId} aria-labelledby="recent-title">
      <RecentTitle id="recent-title">
        {recentTransactions.title}
      </RecentTitle>

      {!hasTransactions ? (
        <EmptyMessage>{recentTransactions.emptyMessage}</EmptyMessage>
      ) : (
        <TableWrap>
          <TransactionsTable>
            <thead>
              <tr>
                <HeaderCell>Transação</HeaderCell>
                <HeaderCell>Categoria</HeaderCell>
                <HeaderCell>Data</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Valor</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.firstTransaction !== null && (
                <tr>
                  <DescriptionCell>
                    {recentTransactions.firstTransaction.description}
                  </DescriptionCell>
                  <MutedCell>
                    {recentTransactions.firstTransaction.category}
                  </MutedCell>
                  <MutedCell>
                    {recentTransactions.firstTransaction.formattedDate}
                  </MutedCell>
                  <Cell>
                    {recentTransactions.firstTransaction.statusLabel}
                  </Cell>
                  <AmountCell
                    $type={recentTransactions.firstTransaction.type}
                  >
                    <SensitiveValue>{recentTransactions.firstTransaction.formattedAmount}</SensitiveValue>
                  </AmountCell>
                </tr>
              )}
              {recentTransactions.secondTransaction !== null && (
                <tr>
                  <DescriptionCell>
                    {recentTransactions.secondTransaction.description}
                  </DescriptionCell>
                  <MutedCell>
                    {recentTransactions.secondTransaction.category}
                  </MutedCell>
                  <MutedCell>
                    {recentTransactions.secondTransaction.formattedDate}
                  </MutedCell>
                  <Cell>
                    {recentTransactions.secondTransaction.statusLabel}
                  </Cell>
                  <AmountCell
                    $type={recentTransactions.secondTransaction.type}
                  >
                    <SensitiveValue>{recentTransactions.secondTransaction.formattedAmount}</SensitiveValue>
                  </AmountCell>
                </tr>
              )}
              {recentTransactions.thirdTransaction !== null && (
                <tr>
                  <DescriptionCell>
                    {recentTransactions.thirdTransaction.description}
                  </DescriptionCell>
                  <MutedCell>
                    {recentTransactions.thirdTransaction.category}
                  </MutedCell>
                  <MutedCell>
                    {recentTransactions.thirdTransaction.formattedDate}
                  </MutedCell>
                  <Cell>
                    {recentTransactions.thirdTransaction.statusLabel}
                  </Cell>
                  <AmountCell
                    $type={recentTransactions.thirdTransaction.type}
                  >
                    <SensitiveValue>{recentTransactions.thirdTransaction.formattedAmount}</SensitiveValue>
                  </AmountCell>
                </tr>
              )}
              {recentTransactions.fourthTransaction !== null && (
                <tr>
                  <DescriptionCell>
                    {recentTransactions.fourthTransaction.description}
                  </DescriptionCell>
                  <MutedCell>
                    {recentTransactions.fourthTransaction.category}
                  </MutedCell>
                  <MutedCell>
                    {recentTransactions.fourthTransaction.formattedDate}
                  </MutedCell>
                  <Cell>
                    {recentTransactions.fourthTransaction.statusLabel}
                  </Cell>
                  <AmountCell
                    $type={recentTransactions.fourthTransaction.type}
                  >
                    <SensitiveValue>{recentTransactions.fourthTransaction.formattedAmount}</SensitiveValue>
                  </AmountCell>
                </tr>
              )}
              {recentTransactions.fifthTransaction !== null && (
                <tr>
                  <DescriptionCell>
                    {recentTransactions.fifthTransaction.description}
                  </DescriptionCell>
                  <MutedCell>
                    {recentTransactions.fifthTransaction.category}
                  </MutedCell>
                  <MutedCell>
                    {recentTransactions.fifthTransaction.formattedDate}
                  </MutedCell>
                  <Cell>
                    {recentTransactions.fifthTransaction.statusLabel}
                  </Cell>
                  <AmountCell
                    $type={recentTransactions.fifthTransaction.type}
                  >
                    <SensitiveValue>{recentTransactions.fifthTransaction.formattedAmount}</SensitiveValue>
                  </AmountCell>
                </tr>
              )}
            </tbody>
          </TransactionsTable>
        </TableWrap>
      )}
    </RecentRoot>
  );
};
