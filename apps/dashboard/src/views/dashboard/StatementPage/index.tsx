"use client";

import { Plus } from "lucide-react";
import { DeleteTransactionModal } from "@dashboard/components/dashboard/DeleteTransactionModal";
import { TransactionDetailsModal } from "@dashboard/components/dashboard/TransactionDetailsModal";
import { TransactionFilters } from "@dashboard/components/dashboard/TransactionFilters";
import { TransactionPagination } from "@dashboard/components/dashboard/TransactionPagination";
import { TransactionTable } from "@dashboard/components/dashboard/TransactionTable";
import { TransactionFormModal } from "@dashboard/components/form/TransactionFormModal";
import { QueryState } from "@banking/shared/ui/components/QueryState";
import { Button } from "@banking/shared/ui/components/button";
import type {
  TransactionEditableFields,
  TransactionViewModel,
} from "@banking/shared/types";
import { useLanguage } from "@dashboard/contexts/LanguageContext";
import {
  useCreateTransactionSubmissionMutation,
  useDeleteTransactionMutation,
  useDeleteTransactionAttachmentMutation,
  useTransactionAttachmentsQuery,
  useTransactionCategoriesQuery,
  useTransactionsQuery,
  useUpdateTransactionSubmissionMutation,
} from "@dashboard/features/transactions/hooks/useTransactions";
import {
  createTransactionSearchParams,
  useTransactionListSearchParams,
} from "@dashboard/features/transactions/hooks/useTransactionListSearchParams";
import { useTransactionDialogs } from "@dashboard/hooks/use-transaction-dialogs";
import { PageStack, PageSubtitle, PageTitle } from "@banking/shared/ui/styles/shared";

import type { IStatementPageProps } from "./interface";
import { CategoryStatus, PageHeader, RefreshStatus } from "./styled";

export default function StatementPage({
  "data-testid": dataTestId,
}: IStatementPageProps) {
  const { t } = useLanguage();
  const {
    filters,
    hasActiveFilters,
    applyFilters,
    clearFilters,
    goToPage,
  } = useTransactionListSearchParams();
  const transactionsQuery = useTransactionsQuery(filters);
  const categoriesQuery = useTransactionCategoriesQuery();
  const createTransaction = useCreateTransactionSubmissionMutation();
  const updateTransaction = useUpdateTransactionSubmissionMutation();
  const deleteTransaction = useDeleteTransactionMutation();
  const deleteAttachment = useDeleteTransactionAttachmentMutation();
  const {
    dialog,
    selectedTransactionId,
    openCreate,
    openDetails,
    openEdit,
    openDelete,
    closeDialog,
  } = useTransactionDialogs();
  const selectedTransaction =
    transactionsQuery.data?.items.find(
      (transaction) => transaction.id === selectedTransactionId,
    ) ?? null;
  const attachmentsQuery = useTransactionAttachmentsQuery(
    selectedTransactionId,
    dialog === "edit" || dialog === "details",
  );

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      createTransaction.reset();
      updateTransaction.reset();
      deleteTransaction.reset();
      deleteAttachment.reset();
      closeDialog();
    }
  };

  const handleCreateTransaction = (
    transaction: TransactionEditableFields,
    attachments: File[],
    persistedTransaction: TransactionViewModel | null,
  ) =>
    createTransaction.mutateAsync({
      transaction,
      attachments,
      persistedTransaction,
    });

  const handleUpdateTransaction = (
    transaction: TransactionEditableFields,
    attachments: File[],
    persistedTransaction: TransactionViewModel | null,
  ) => {
    if (!selectedTransaction) {
      return Promise.reject(new Error("Transação não encontrada."));
    }

    return updateTransaction.mutateAsync({
      transactionId: selectedTransaction.id,
      transaction,
      attachments,
      persistedTransaction,
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    if (!selectedTransaction) return;

    deleteAttachment.mutate({
      transactionId: selectedTransaction.id,
      attachmentId,
    });
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    deleteTransaction.mutate(selectedTransaction.id, {
      onSuccess: closeDialog,
    });
  };

  return (
    <PageStack $gap="1.5rem" data-testid={dataTestId}>
      <PageHeader>
        <div>
          <PageTitle>{t("statement.title")}</PageTitle>
          <PageSubtitle>{t("statement.subtitle")}</PageSubtitle>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus />
          Nova Transação
        </Button>
      </PageHeader>

      <TransactionFilters
        key={`${createTransactionSearchParams(filters)}-${categoriesQuery.isPending}`}
        categories={categoriesQuery.data?.items ?? []}
        filters={filters}
        isCategoriesError={categoriesQuery.isError}
        isCategoriesLoading={categoriesQuery.isPending}
        isDisabled={transactionsQuery.isFetching}
        onClear={clearFilters}
        onSubmit={applyFilters}
      />
      {categoriesQuery.isError && (
        <CategoryStatus role="status">
          Não foi possível carregar as categorias. Os demais filtros continuam
          disponíveis.
        </CategoryStatus>
      )}
      {transactionsQuery.isFetching && !transactionsQuery.isPending && (
        <RefreshStatus aria-live="polite" role="status">
          Atualizando transações...
        </RefreshStatus>
      )}
      {transactionsQuery.isPending && (
        <QueryState kind="loading" message="Carregando extrato..." />
      )}
      {transactionsQuery.isError && (
        <QueryState
          kind="error"
          message="Não foi possível carregar o extrato."
          onRetry={() => transactionsQuery.refetch()}
        />
      )}
      {!transactionsQuery.isError &&
        transactionsQuery.data?.total === 0 &&
        !hasActiveFilters && (
          <QueryState kind="empty" message="Nenhuma transação cadastrada." />
        )}
      {!transactionsQuery.isError &&
        transactionsQuery.data?.total === 0 &&
        hasActiveFilters && (
          <QueryState
            kind="empty"
            message="Nenhuma transação corresponde aos filtros aplicados."
          />
        )}
      {!transactionsQuery.isError &&
        transactionsQuery.data &&
        transactionsQuery.data.items.length > 0 && (
          <TransactionTable
            data={transactionsQuery.data.items}
            onView={openDetails}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
      {!transactionsQuery.isError &&
        transactionsQuery.data &&
        transactionsQuery.data.total > 0 && (
          <TransactionPagination
            firstPage={transactionsQuery.data.firstPage}
            lastPage={transactionsQuery.data.lastPage}
            nextPage={transactionsQuery.data.nextPage}
            onPageChange={goToPage}
            page={transactionsQuery.data.page}
            previousPage={transactionsQuery.data.previousPage}
            resultsLabel={transactionsQuery.data.resultsLabel}
            totalPages={transactionsQuery.data.totalPages}
          />
        )}

      <TransactionFormModal
        mode="create"
        open={dialog === "create"}
        categories={categoriesQuery.data?.items ?? []}
        existingAttachments={[]}
        isCategoriesError={categoriesQuery.isError}
        isCategoriesLoading={categoriesQuery.isPending}
        isExistingAttachmentsError={false}
        isExistingAttachmentsLoading={false}
        isRemovingAttachment={false}
        onOpenChange={handleDialogOpenChange}
        onRemoveExistingAttachment={handleRemoveAttachment}
        onSubmit={handleCreateTransaction}
        errorMessage={createTransaction.error?.message}
        isSubmitting={createTransaction.isPending}
      />
      <TransactionFormModal
        mode="edit"
        open={dialog === "edit"}
        transaction={selectedTransaction}
        categories={categoriesQuery.data?.items ?? []}
        existingAttachments={attachmentsQuery.data?.items ?? []}
        isCategoriesError={categoriesQuery.isError}
        isCategoriesLoading={categoriesQuery.isPending}
        isExistingAttachmentsError={attachmentsQuery.isError}
        isExistingAttachmentsLoading={attachmentsQuery.isPending}
        isRemovingAttachment={deleteAttachment.isPending}
        onOpenChange={handleDialogOpenChange}
        onRemoveExistingAttachment={handleRemoveAttachment}
        onSubmit={handleUpdateTransaction}
        errorMessage={
          updateTransaction.error?.message ?? deleteAttachment.error?.message
        }
        isSubmitting={updateTransaction.isPending}
      />
      <TransactionDetailsModal
        open={dialog === "details"}
        transaction={selectedTransaction}
        attachments={attachmentsQuery.data?.items ?? []}
        isAttachmentsError={attachmentsQuery.isError}
        isAttachmentsLoading={attachmentsQuery.isPending}
        onOpenChange={handleDialogOpenChange}
        onRetryAttachments={() => void attachmentsQuery.refetch()}
      />
      <DeleteTransactionModal
        open={dialog === "delete"}
        transaction={selectedTransaction}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleDeleteTransaction}
        errorMessage={deleteTransaction.error?.message}
        isSubmitting={deleteTransaction.isPending}
      />
    </PageStack>
  );
}
