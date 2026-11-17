"use client";

import { Button } from "@banking/shared/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@banking/shared/ui/components/dialog";

import type { DeleteTransactionModalProps } from "./interface";
import { MutationError } from "./styled";

export function DeleteTransactionModal({
  "data-testid": dataTestId,
  open,
  transaction,
  onOpenChange,
  onConfirm,
  errorMessage,
  isSubmitting = false,
}: DeleteTransactionModalProps) {
  // Durante a exclusão otimista a transação já saiu da lista em cache; o
  // modal continua montado até a mutation terminar (sucesso fecha, erro
  // restaura a linha e exibe a mensagem).
  if (!transaction && !isSubmitting) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={dataTestId}
        aria-busy={isSubmitting}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle>Excluir transação?</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        {errorMessage && <MutationError role="alert">{errorMessage}</MutationError>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
