"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TransactionViewModel } from "@banking/shared/types";
import type { AttachmentUploadFailure } from "@dashboard/features/transactions/types";
import { Button } from "@banking/shared/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@banking/shared/ui/components/dialog";
import { Input } from "@banking/shared/ui/components/input";
import { Label } from "@banking/shared/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@banking/shared/ui/components/select";
import { TransactionAttachmentsField } from "../TransactionAttachmentsField";
import type {
  ICategoryOptionItemsProps,
  ITransactionFormModalProps,
} from "./interface";
import {
  createTransactionFormSchema,
  getCurrentDateValue,
  getDefaultTransactionFormValues,
  getEditTransactionFormValues,
  type TransactionFormValues,
} from "./schema";
import {
  CharacterCounter,
  Field,
  FieldError,
  Form,
  FormGrid,
  PartialSubmissionStatus,
  Textarea,
} from "./styled";

export const TransactionFormModal = ({
  "data-testid": dataTestId,
  mode,
  open,
  transaction,
  categories,
  existingAttachments,
  isCategoriesError,
  isCategoriesLoading,
  isExistingAttachmentsError,
  isExistingAttachmentsLoading,
  isRemovingAttachment,
  onOpenChange,
  onRemoveExistingAttachment,
  onSubmit,
  errorMessage,
  isSubmitting = false,
}: ITransactionFormModalProps) => {
  const [failedAttachments, setFailedAttachments] = useState<
    AttachmentUploadFailure[]
  >([]);
  const [persistedTransaction, setPersistedTransaction] =
    useState<TransactionViewModel | null>(null);
  const schema = useMemo(
    () => createTransactionFormSchema(existingAttachments.length),
    [existingAttachments.length],
  );
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultTransactionFormValues(),
  });
  const selectedFiles = form.watch("attachments");
  const observation = form.watch("transaction.observation");

  useEffect(() => {
    if (!open) return;

    const firstCategory = categories[0]?.name ?? "";
    form.reset(
      mode === "edit" && transaction
        ? getEditTransactionFormValues(transaction.editableFields)
        : getDefaultTransactionFormValues(firstCategory),
    );
    setFailedAttachments([]);
    setPersistedTransaction(null);
  }, [categories, form, mode, open, transaction]);

  const handleSubmit: SubmitHandler<TransactionFormValues> = async (
    values,
  ) => {
    try {
      const result = await onSubmit(
        values.transaction,
        values.attachments,
        persistedTransaction,
      );

      if (result.failedAttachments.length === 0) {
        setFailedAttachments([]);
        setPersistedTransaction(null);
        onOpenChange(false);
        return;
      }

      const filesToRetry: File[] = [];
      for (const failure of result.failedAttachments) {
        filesToRetry.push(failure.file);
      }

      setPersistedTransaction(result.transaction);
      setFailedAttachments(result.failedAttachments);
      form.setValue("attachments", filesToRetry, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      return;
    }
  };

  const title =
    mode === "create" ? "Nova Transação" : "Editar Transação";
  const actionLabel = persistedTransaction
    ? "Reenviar anexos"
    : mode === "create"
      ? "Criar transação"
      : "Salvar alterações";
  const isFormBlocked =
    isSubmitting ||
    isCategoriesLoading ||
    isCategoriesError ||
    isExistingAttachmentsLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        data-testid={dataTestId}
        aria-busy={isSubmitting}
        hideCloseButton={isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Informe os dados e adicione comprovantes, se necessário.
          </DialogDescription>
        </DialogHeader>

        <Form onSubmit={form.handleSubmit(handleSubmit)}>
          <Field>
            <Label htmlFor={`${mode}-transaction-description`}>
              Descrição
            </Label>
            <Input
              id={`${mode}-transaction-description`}
              placeholder="Ex.: Pagamento de aluguel"
              maxLength={120}
              disabled={isSubmitting}
              {...form.register("transaction.description")}
            />
            <FieldError>
              {form.formState.errors.transaction?.description?.message}
            </FieldError>
          </Field>

          <FormGrid>
            <Field>
              <Label>Tipo</Label>
              <Controller
                control={form.control}
                name="transaction.type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger aria-label="Tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Entrada</SelectItem>
                      <SelectItem value="expense">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>
                {form.formState.errors.transaction?.type?.message}
              </FieldError>
            </Field>

            <Field>
              <Label>Categoria</Label>
              <Controller
                control={form.control}
                name="transaction.category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    disabled={
                      isSubmitting ||
                      isCategoriesLoading ||
                      isCategoriesError
                    }
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger aria-label="Categoria">
                      <SelectValue
                        placeholder={
                          isCategoriesLoading
                            ? "Carregando categorias..."
                            : "Selecione uma categoria"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <CategoryOptionItems categories={categories} />
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>
                {isCategoriesError
                  ? "Não foi possível carregar as categorias."
                  : form.formState.errors.transaction?.category?.message}
              </FieldError>
            </Field>
          </FormGrid>

          <FormGrid>
            <Field>
              <Label htmlFor={`${mode}-transaction-amount`}>Valor</Label>
              <Input
                id={`${mode}-transaction-amount`}
                type="number"
                min="0.01"
                max="999999999.99"
                step="0.01"
                inputMode="decimal"
                disabled={isSubmitting}
                {...form.register("transaction.amount")}
              />
              <FieldError>
                {form.formState.errors.transaction?.amount?.message}
              </FieldError>
            </Field>

            <Field>
              <Label htmlFor={`${mode}-transaction-date`}>Data</Label>
              <Input
                id={`${mode}-transaction-date`}
                type="date"
                max={getCurrentDateValue()}
                disabled={isSubmitting}
                {...form.register("transaction.date")}
              />
              <FieldError>
                {form.formState.errors.transaction?.date?.message}
              </FieldError>
            </Field>
          </FormGrid>

          <Field>
            <Label>Status</Label>
            <Controller
              control={form.control}
              name="transaction.status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>
              {form.formState.errors.transaction?.status?.message}
            </FieldError>
          </Field>

          <Field>
            <Label htmlFor={`${mode}-transaction-observation`}>
              Observação
            </Label>
            <Textarea
              id={`${mode}-transaction-observation`}
              maxLength={500}
              placeholder="Inclua informações adicionais, se necessário."
              disabled={isSubmitting}
              {...form.register("transaction.observation")}
            />
            <CharacterCounter>
              {observation.length} de 500 caracteres
            </CharacterCounter>
            <FieldError>
              {form.formState.errors.transaction?.observation?.message}
            </FieldError>
          </Field>

          <TransactionAttachmentsField
            existingAttachments={existingAttachments}
            failedAttachments={failedAttachments}
            isExistingAttachmentsError={isExistingAttachmentsError}
            isExistingAttachmentsLoading={isExistingAttachmentsLoading}
            isRemovingAttachment={isRemovingAttachment}
            selectedFiles={selectedFiles}
            validationError={
              form.formState.errors.attachments?.message ??
              form.formState.errors.attachments?.[0]?.message
            }
            onClearSelectedFiles={() =>
              form.setValue("attachments", [], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onFilesChange={(files) =>
              form.setValue("attachments", files, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onRemoveExistingAttachment={onRemoveExistingAttachment}
          />

          {persistedTransaction && (
            <PartialSubmissionStatus role="status">
              A transação foi salva, mas alguns anexos falharam. Corrija o
              problema ou tente reenviar somente os arquivos pendentes.
            </PartialSubmissionStatus>
          )}
          {errorMessage && <FieldError role="alert">{errorMessage}</FieldError>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isFormBlocked}>
              {isSubmitting ? "Enviando..." : actionLabel}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const CategoryOptionItems = ({
  categories,
  index = 0,
}: ICategoryOptionItemsProps) => {
  const category = categories[index];
  if (!category) return null;

  return (
    <>
      <SelectItem value={category.name}>{category.name}</SelectItem>
      <CategoryOptionItems categories={categories} index={index + 1} />
    </>
  );
};
