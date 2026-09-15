"use client";

import { Eye, MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@banking/shared/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@banking/shared/ui/components/dropdown-menu";
import { useLanguage } from "@dashboard/contexts/LanguageContext";
import { VisuallyHidden } from "@banking/shared/ui/styles/shared";

import type { StatusIconProps, TransactionActionsMenuProps, TransactionTableProps } from "./interface";
import {
  ActionMenuContent,
  ActionsCell,
  AmountCell,
  AttachmentCount,
  BodyCell,
  BodyRow,
  CompletedIcon,
  DestructiveMenuItem,
  DesktopTableWrap,
  ExpenseIcon,
  FailedIcon,
  HeaderCell,
  HeaderRow,
  IncomeIcon,
  MobileAmount,
  MobileDescription,
  MobileItem,
  MobileItemInfo,
  MobileList,
  MobileMeta,
  MutedCell,
  PendingIcon,
  Status,
  Table,
  TableRoot,
  TransactionCell,
  TypeIconBox,
} from "./styled";

export function TransactionTable({ "data-testid": dataTestId, data, onView, onEdit, onDelete }: TransactionTableProps) {
  const { t } = useLanguage();
  const hasActions =
    onView !== undefined ||
    onEdit !== undefined ||
    onDelete !== undefined;

  return (
    <TableRoot data-testid={dataTestId}>
      <DesktopTableWrap>
        <Table>
          <thead>
            <HeaderRow>
              <HeaderCell>{t("table.transaction")}</HeaderCell>
              <HeaderCell>{t("table.category")}</HeaderCell>
              <HeaderCell>{t("table.date")}</HeaderCell>
              <HeaderCell>{t("table.status")}</HeaderCell>
              <HeaderCell>Anexos</HeaderCell>
              <HeaderCell $align="right">{t("table.amount")}</HeaderCell>
              {hasActions && <HeaderCell $align="right">Ações</HeaderCell>}
            </HeaderRow>
          </thead>
          <tbody>
            {data.map((transaction) => (
              <BodyRow key={transaction.id}>
                <TransactionCell>
                  <TypeIconBox $type={transaction.type}>
                    {transaction.type === "income" ? <IncomeIcon size={14} /> : <ExpenseIcon size={14} />}
                  </TypeIconBox>
                  {transaction.description}
                </TransactionCell>
                <MutedCell>{transaction.category}</MutedCell>
                <MutedCell>{transaction.formattedDate}</MutedCell>
                <BodyCell>
                  <Status>
                    <StatusIcon status={transaction.status} />
                    {transaction.statusLabel}
                  </Status>
                </BodyCell>
                <MutedCell>
                  <AttachmentCount
                    aria-label={formatAttachmentCount(transaction.attachmentCount)}
                  >
                    <Paperclip aria-hidden="true" size={14} />
                    {formatAttachmentCount(transaction.attachmentCount)}
                  </AttachmentCount>
                </MutedCell>
                <AmountCell $type={transaction.type}>
                  {transaction.formattedAmount}
                </AmountCell>
                {hasActions && (
                  <ActionsCell>
                    <TransactionActionsMenu transaction={transaction} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                  </ActionsCell>
                )}
              </BodyRow>
            ))}
          </tbody>
        </Table>
      </DesktopTableWrap>

      <MobileList>
        {data.map((transaction) => (
          <MobileItem key={transaction.id}>
            <MobileItemInfo>
              <TypeIconBox $type={transaction.type}>
                {transaction.type === "income" ? <IncomeIcon size={14} /> : <ExpenseIcon size={14} />}
              </TypeIconBox>
              <div>
                <MobileDescription>{transaction.description}</MobileDescription>
                <MobileMeta>
                  {transaction.category} · {transaction.formattedDate} ·{" "}
                  {formatAttachmentCount(transaction.attachmentCount)}
                </MobileMeta>
              </div>
            </MobileItemInfo>
            <MobileAmount $type={transaction.type}>
              {transaction.formattedAmount}
            </MobileAmount>
            {hasActions && (
              <TransactionActionsMenu transaction={transaction} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            )}
          </MobileItem>
        ))}
      </MobileList>
    </TableRoot>
  );
}

function formatAttachmentCount(count: number) {
  if (count === 0) return "Nenhum anexo";
  return `${count} ${count === 1 ? "anexo" : "anexos"}`;
}

function TransactionActionsMenu({
  transaction,
  onView,
  onEdit,
  onDelete,
}: TransactionActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Ações para ${transaction.description}`}>
          <MoreHorizontal />
          <VisuallyHidden>Abrir ações</VisuallyHidden>
        </Button>
      </DropdownMenuTrigger>
      <ActionMenuContent align="end">
        {onView && (
          <DropdownMenuItem onSelect={() => onView(transaction.id)}>
            <Eye />
            Ver detalhes
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onSelect={() => onEdit(transaction.id)}>
            <Pencil />
            Editar
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DestructiveMenuItem onSelect={() => onDelete(transaction.id)}>
            <Trash2 />
            Excluir
          </DestructiveMenuItem>
        )}
      </ActionMenuContent>
    </DropdownMenu>
  );
}

function StatusIcon({ status }: StatusIconProps) {
  if (status === "pending") {
    return <PendingIcon size={14} />;
  }

  if (status === "failed") {
    return <FailedIcon size={14} />;
  }

  return <CompletedIcon size={14} />;
}
