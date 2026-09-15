"use client";

import { Paperclip, Trash2 } from "lucide-react";
import { transactionAttachmentPolicy } from "@banking/shared/types";
import { Button } from "@banking/shared/ui/components/button";
import { Input } from "@banking/shared/ui/components/input";
import { Label } from "@banking/shared/ui/components/label";
import type {
  IExistingAttachmentItemsProps,
  ISelectedFileItemsProps,
  ITransactionAttachmentsFieldProps,
  IUploadFailureItemsProps,
} from "./interface";
import {
  AttachmentActions,
  AttachmentError,
  AttachmentHint,
  AttachmentItem,
  AttachmentList,
  AttachmentMeta,
  AttachmentName,
  AttachmentsFieldset,
  AttachmentsLegend,
  AttachmentStatus,
  FailureList,
} from "./styled";

export const TransactionAttachmentsField = ({
  "data-testid": dataTestId,
  existingAttachments,
  failedAttachments,
  isExistingAttachmentsError,
  isExistingAttachmentsLoading,
  isRemovingAttachment,
  selectedFiles,
  validationError,
  onClearSelectedFiles,
  onFilesChange,
  onRemoveExistingAttachment,
}: ITransactionAttachmentsFieldProps) => {
  const handleFilesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files: File[] = [];
    const selectedFileList = event.currentTarget.files;

    if (selectedFileList) {
      for (const file of selectedFileList) {
        files.push(file);
      }
    }

    onFilesChange(files);
    event.currentTarget.value = "";
  };

  return (
    <AttachmentsFieldset data-testid={dataTestId}>
      <AttachmentsLegend>Anexos</AttachmentsLegend>
      <Label htmlFor="transaction-attachments">
        Selecione os comprovantes
      </Label>
      <Input
        id="transaction-attachments"
        type="file"
        accept={transactionAttachmentPolicy.acceptedFileExtensions.join(",")}
        multiple
        onChange={handleFilesChange}
      />
      <AttachmentHint>
        Até 5 arquivos PDF, JPEG ou PNG, com no máximo 5 MB cada.
      </AttachmentHint>

      {isExistingAttachmentsLoading && (
        <AttachmentStatus role="status">
          Carregando anexos existentes...
        </AttachmentStatus>
      )}
      {isExistingAttachmentsError && (
        <AttachmentError role="alert">
          Não foi possível carregar os anexos existentes.
        </AttachmentError>
      )}
      {existingAttachments.length > 0 && (
        <AttachmentList aria-label="Anexos existentes">
          <ExistingAttachmentItems
            attachments={existingAttachments}
            isRemovingAttachment={isRemovingAttachment}
            onRemove={onRemoveExistingAttachment}
          />
        </AttachmentList>
      )}

      {selectedFiles.length > 0 && (
        <>
          <AttachmentList aria-label="Anexos selecionados">
            <SelectedFileItems files={selectedFiles} />
          </AttachmentList>
          <AttachmentActions>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearSelectedFiles}
            >
              Limpar seleção
            </Button>
          </AttachmentActions>
        </>
      )}

      {failedAttachments.length > 0 && (
        <FailureList aria-label="Falhas no envio dos anexos">
          <UploadFailureItems failures={failedAttachments} />
        </FailureList>
      )}
      {validationError && (
        <AttachmentError role="alert">{validationError}</AttachmentError>
      )}
    </AttachmentsFieldset>
  );
};

const ExistingAttachmentItems = ({
  attachments,
  index = 0,
  isRemovingAttachment,
  onRemove,
}: IExistingAttachmentItemsProps) => {
  const attachment = attachments[index];
  if (!attachment) return null;

  return (
    <>
      <AttachmentItem>
        <AttachmentName>
          <Paperclip aria-hidden="true" /> {attachment.fileName}
        </AttachmentName>
        <AttachmentMeta>{attachment.formattedSize}</AttachmentMeta>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isRemovingAttachment}
          aria-label={`Remover anexo ${attachment.fileName}`}
          onClick={() => onRemove(attachment.id)}
        >
          <Trash2 />
        </Button>
      </AttachmentItem>
      <ExistingAttachmentItems
        attachments={attachments}
        index={index + 1}
        isRemovingAttachment={isRemovingAttachment}
        onRemove={onRemove}
      />
    </>
  );
};

const SelectedFileItems = ({
  files,
  index = 0,
}: ISelectedFileItemsProps) => {
  const file = files[index];
  if (!file) return null;

  return (
    <>
      <AttachmentItem>
        <AttachmentName>{file.name}</AttachmentName>
        <AttachmentMeta>Pronto para envio</AttachmentMeta>
      </AttachmentItem>
      <SelectedFileItems files={files} index={index + 1} />
    </>
  );
};

const UploadFailureItems = ({
  failures,
  index = 0,
}: IUploadFailureItemsProps) => {
  const failure = failures[index];
  if (!failure) return null;

  return (
    <>
      <li>
        {failure.file.name}: {failure.message}
      </li>
      <UploadFailureItems failures={failures} index={index + 1} />
    </>
  );
};
