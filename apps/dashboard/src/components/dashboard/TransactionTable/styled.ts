import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import styled from "styled-components";
import { DropdownMenuContent, DropdownMenuItem } from "@banking/shared/ui/components/dropdown-menu";
import type { TransactionViewModel } from "@banking/shared/types";

import type { HeaderCellAlign } from "./interface";

export const TableRoot = styled.div`
  overflow: hidden;
  border: 1px solid hsl(var(--border) / 0.4);
  border-radius: var(--radius);
`;

export const DesktopTableWrap = styled.div`
  display: none;
  overflow-x: auto;

  @media (min-width: 768px) {
    display: block;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

export const HeaderRow = styled.tr`
  border-bottom: 1px solid hsl(var(--border) / 0.3);
  background: hsl(var(--muted) / 0.3);
`;

export const HeaderCell = styled.th<{ $align?: HeaderCellAlign }>`
  padding: 1rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
  text-align: ${({ $align = "left" }) => $align};
`;

export const BodyRow = styled.tr`
  border-bottom: 1px solid hsl(var(--border) / 0.2);
  transition: background-color 160ms ease;

  &:hover {
    background: hsl(var(--muted) / 0.2);
  }
`;

export const BodyCell = styled.td`
  padding: 1rem;
`;

export const TransactionCell = styled(BodyCell)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const MutedCell = styled(BodyCell)`
  color: hsl(var(--muted-foreground));
`;

export const AmountCell = styled(BodyCell)<{ $type: TransactionViewModel["type"] }>`
  color: ${({ $type }) => ($type === "income" ? "hsl(var(--success))" : "hsl(var(--destructive))")};
  font-weight: 500;
  text-align: right;
`;

export const ActionsCell = styled(BodyCell)`
  width: 3rem;
  text-align: right;
`;

export const TypeIconBox = styled.div<{ $type: TransactionViewModel["type"] }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: calc(var(--radius) - 2px);
  background: ${({ $type }) => ($type === "income" ? "hsl(var(--success) / 0.1)" : "hsl(var(--destructive) / 0.1)")};
`;

export const IncomeIcon = styled(ArrowDownLeft)`
  color: hsl(var(--success));
`;

export const ExpenseIcon = styled(ArrowUpRight)`
  color: hsl(var(--destructive));
`;

export const CompletedIcon = styled(CheckCircle2)`
  color: hsl(var(--success));
`;

export const PendingIcon = styled(Clock)`
  color: hsl(var(--warning));
`;

export const FailedIcon = styled(XCircle)`
  color: hsl(var(--destructive));
`;

export const Status = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

export const AttachmentCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
`;

export const MobileList = styled.div`
  display: block;

  @media (min-width: 768px) {
    display: none;
  }
`;

export const MobileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;

  & + & {
    border-top: 1px solid hsl(var(--border) / 0.2);
  }
`;

export const MobileItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

export const MobileDescription = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
`;

export const MobileMeta = styled.div`
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
`;

export const MobileAmount = styled.div<{ $type: TransactionViewModel["type"] }>`
  flex-shrink: 0;
  color: ${({ $type }) => ($type === "income" ? "hsl(var(--success))" : "hsl(var(--destructive))")};
  font-size: 0.875rem;
  font-weight: 500;
`;

export const ActionMenuContent = styled(DropdownMenuContent)`
  min-width: 8rem;

  svg {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
  }
`;

export const DestructiveMenuItem = styled(DropdownMenuItem)`
  color: hsl(var(--destructive));

  &:focus,
  &[data-highlighted] {
    background: hsl(var(--destructive) / 0.1);
    color: hsl(var(--destructive));
  }
`;
