"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@banking/shared/ui/components/dialog";
import type { TransactionDetailsModalProps } from "./interface";
import {
  AttachmentDetailsRow,
  AttachmentItem,
  AttachmentList,
  AttachmentMeta,
  AttachmentName,
  AttachmentStatus,
  DetailsLabel,
  DetailsList,
  DetailsRow,
  DetailsValue,
  RetryAttachmentsButton,
} from "./styled";

export function TransactionDetailsModal({
  "data-testid": dataTestId,
  open,
  transaction,
  attachments,
  isAttachmentsError,
  isAttachmentsLoading,
  onOpenChange,
  onRetryAttachments,
}: TransactionDetailsModalProps) {
  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={dataTestId}>
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>Informações completas do registro.</DialogDescription>
        </DialogHeader>

        <DetailsList>
          <DetailsRow>
            <DetailsLabel>Transação</DetailsLabel>
            <DetailsValue>{transaction.description}</DetailsValue>
          </DetailsRow>
          <DetailsRow>
            <DetailsLabel>Categoria</DetailsLabel>
            <DetailsValue>{transaction.category}</DetailsValue>
          </DetailsRow>
          <DetailsRow>
            <DetailsLabel>Tipo</DetailsLabel>
            <DetailsValue>{transaction.typeLabel}</DetailsValue>
          </DetailsRow>
          <DetailsRow>
            <DetailsLabel>Data</DetailsLabel>
            <DetailsValue>{transaction.formattedDate}</DetailsValue>
          </DetailsRow>
          <DetailsRow>
            <DetailsLabel>Status</DetailsLabel>
            <DetailsValue>{transaction.statusLabel}</DetailsValue>
          </DetailsRow>
          <DetailsRow>
            <DetailsLabel>Valor</DetailsLabel>
            <DetailsValue>{transaction.formattedAmount}</DetailsValue>
          </DetailsRow>
          <DetailsRow>
            <DetailsLabel>Observação</DetailsLabel>
            <DetailsValue>
              {transaction.observation || "Não informada"}
            </DetailsValue>
          </DetailsRow>
          <AttachmentDetailsRow>
            <DetailsLabel>Anexos</DetailsLabel>
            <DetailsValue>
              {isAttachmentsLoading && (
                <AttachmentStatus role="status">
                  Carregando anexos...
                </AttachmentStatus>
              )}
              {isAttachmentsError && (
                <AttachmentStatus role="alert">
                  Não foi possível carregar os anexos.{" "}
                  <RetryAttachmentsButton
                    type="button"
                    onClick={onRetryAttachments}
                  >
                    Tentar novamente
                  </RetryAttachmentsButton>
                </AttachmentStatus>
              )}
              {!isAttachmentsLoading &&
                !isAttachmentsError &&
                attachments.length === 0 && (
                  <AttachmentStatus>Nenhum anexo</AttachmentStatus>
                )}
              {!isAttachmentsLoading &&
                !isAttachmentsError &&
                attachments.length > 0 && (
                  <AttachmentList aria-label="Anexos da transação">
                    {attachments.map((attachment) => (
                      <AttachmentItem key={attachment.id}>
                        <AttachmentName>{attachment.fileName}</AttachmentName>
                        <AttachmentMeta>{attachment.formattedSize}</AttachmentMeta>
                      </AttachmentItem>
                    ))}
                  </AttachmentList>
                )}
            </DetailsValue>
          </AttachmentDetailsRow>
        </DetailsList>
      </DialogContent>
    </Dialog>
  );
}
