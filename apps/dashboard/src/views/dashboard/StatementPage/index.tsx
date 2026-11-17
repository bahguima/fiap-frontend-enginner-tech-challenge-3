"use client";

import { Plus } from "lucide-react";
import { TransactionFilters } from "@dashboard/components/dashboard/TransactionFilters";
import { TransactionPagination } from "@dashboard/components/dashboard/TransactionPagination";
import { TransactionTable } from "@dashboard/components/dashboard/TransactionTable";
import { QueryState } from "@banking/shared/ui/components/QueryState";
import { Button } from "@banking/shared/ui/components/button";
import type {
  TransactionEditableFields,
  TransactionListFilters,
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
import { useTransactionFilterStream } from "@dashboard/features/transactions/hooks/useTransactionFilterStream";
import { useTransactionListSearchParams } from "@dashboard/features/transactions/hooks/useTransactionListSearchParams";
import { useTransactionDialogs } from "@dashboard/hooks/use-transaction-dialogs";
import { useLatchedFlag } from "@dashboard/hooks/use-latched-flag";
import { PageStack, PageSubtitle, PageTitle } from "@banking/shared/ui/styles/shared";

import type { IStatementPageProps } from "./interface";
import {
  LazyDeleteTransactionModal,
  LazyTransactionDetailsModal,
  LazyTransactionFormModal,
  ModalSuspense,
  preloadTransactionFormModal,
} from "./lazyModals";
import { CategoryStatus, PageHeader, RefreshStatus } from "./styled";

export default function StatementPage({
  "data-testid": dataTestId,
}: IStatementPageProps) {
  const { t } = useLanguage();
  const {
    filters,
    formRevision,
    hasActiveFilters,
    applyFilters,
    clearFilters,
    goToPage,
  } = useTransactionListSearchParams();
  // Digitação e filtros passam pelo stream; só o valor estabilizado chega à
  // URL (e, portanto, à query key do TanStack Query).
  const pushFilters = useTransactionFilterStream(applyFilters);
  // Submit e limpar aplicam na hora e também alimentam o stream, substituindo
  // qualquer valor digitado ainda pendente no debounce.
  const handleSubmitFilters = (nextFilters: TransactionListFilters) => {
    pushFilters(nextFilters);
    applyFilters(nextFilters);
  };
  const handleClearFilters = () => {
    pushFilters({});
    clearFilters();
  };
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
  // Cada modal lazy só é montado (e seu chunk baixado) na primeira abertura.
  const shouldMountCreate = useLatchedFlag(dialog === "create");
  const shouldMountEdit = useLatchedFlag(dialog === "edit");
  const shouldMountDetails = useLatchedFlag(dialog === "details");
  const shouldMountDelete = useLatchedFlag(dialog === "delete");

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
        <Button
          type="button"
          onClick={openCreate}
          onMouseEnter={preloadTransactionFormModal}
          onFocus={preloadTransactionFormModal}
        >
          <Plus />
          Nova Transação
        </Button>
      </PageHeader>

      <TransactionFilters
        key={formRevision}
        categories={categoriesQuery.data?.items ?? []}
        filters={filters}
        isCategoriesError={categoriesQuery.isError}
        isCategoriesLoading={categoriesQuery.isPending}
        onChange={pushFilters}
        onClear={handleClearFilters}
        onSubmit={handleSubmitFilters}
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

      {shouldMountCreate && (
        <ModalSuspense>
          <LazyTransactionFormModal
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
        </ModalSuspense>
      )}
      {shouldMountEdit && (
        <ModalSuspense>
          <LazyTransactionFormModal
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
              updateTransaction.error?.message ??
              deleteAttachment.error?.message
            }
            isSubmitting={updateTransaction.isPending}
          />
        </ModalSuspense>
      )}
      {shouldMountDetails && (
        <ModalSuspense>
          <LazyTransactionDetailsModal
            open={dialog === "details"}
            transaction={selectedTransaction}
            attachments={attachmentsQuery.data?.items ?? []}
            isAttachmentsError={attachmentsQuery.isError}
            isAttachmentsLoading={attachmentsQuery.isPending}
            onOpenChange={handleDialogOpenChange}
            onRetryAttachments={() => void attachmentsQuery.refetch()}
          />
        </ModalSuspense>
      )}
      {shouldMountDelete && (
        <ModalSuspense>
          <LazyDeleteTransactionModal
            open={dialog === "delete"}
            transaction={selectedTransaction}
            onOpenChange={handleDialogOpenChange}
            onConfirm={handleDeleteTransaction}
            errorMessage={deleteTransaction.error?.message}
            isSubmitting={deleteTransaction.isPending}
          />
        </ModalSuspense>
      )}
    </PageStack>
  );
}
