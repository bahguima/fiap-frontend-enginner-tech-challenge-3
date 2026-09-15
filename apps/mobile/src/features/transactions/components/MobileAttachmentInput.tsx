import * as DocumentPicker from "expo-document-picker";
import {
  ExternalLink,
  Paperclip,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { transactionAttachmentPolicy } from "@banking/shared/types";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";
import {
  attachmentErrorMessage,
  validateMobileAttachments,
} from "../data";
import {
  useAttachmentIdFactory,
  useDeleteTransactionAttachmentMutation,
  useTransactionAttachmentsQuery,
  useUploadTransactionAttachmentMutation,
} from "../hooks";
import type {
  AttachmentUploadSummary,
  MobileAttachmentInput as MobileAttachment,
  MobileTransactionAttachment,
} from "../types/attachments";

type LocalAttachmentStatus = "selected" | "uploading" | "failed";

interface LocalAttachment {
  id: string;
  input: MobileAttachment;
  status: LocalAttachmentStatus;
  progress?: number;
  error?: string;
}

export interface MobileAttachmentInputHandle {
  hasPending(): boolean;
  uploadPending(transactionId: string): Promise<AttachmentUploadSummary>;
}

interface MobileAttachmentInputProps {
  disabled?: boolean;
  transactionId?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

function mimeTypeFromName(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerName.endsWith(".png")) return "image/png";
  return "";
}

export function documentAssetToMobileAttachment(
  asset: DocumentPicker.DocumentPickerAsset,
): MobileAttachment {
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? mimeTypeFromName(asset.name),
    size: asset.size ?? 0,
  };
}

function formattedSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ExistingAttachmentRow({
  attachment,
  deleting,
  disabled,
  onDelete,
  onOpen,
}: {
  attachment: MobileTransactionAttachment;
  deleting: boolean;
  disabled: boolean;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;

  return (
    <View className="rounded-card border border-bytebank-border bg-white p-3 dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated">
      <View className="flex-row items-center gap-3">
        <Paperclip aria-hidden color={palette.primary} size={18} />
        <View className="min-w-0 flex-1">
          <Text
            className="font-semibold text-bytebank-text dark:text-bytebank-dark-text"
            numberOfLines={1}
          >
            {attachment.name}
          </Text>
          <Text className="mt-0.5 text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
            {formattedSize(attachment.size)}
            {attachment.status !== "ready" ? " · envio incompleto" : ""}
          </Text>
        </View>
        {attachment.status === "ready" ? (
          <Pressable
            accessibilityLabel={`Abrir ${attachment.name}`}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full"
            disabled={disabled}
            accessibilityState={{ disabled }}
            onPress={onOpen}
          >
            <ExternalLink aria-hidden color={palette.primary} size={19} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={`Excluir ${attachment.name}`}
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full"
          disabled={disabled || deleting}
          accessibilityState={{ busy: deleting, disabled: disabled || deleting }}
          onPress={onDelete}
        >
          {deleting ? (
            <ActivityIndicator color={palette.danger} />
          ) : (
            <Trash2 aria-hidden color={palette.danger} size={19} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export const MobileAttachmentInput = forwardRef<
  MobileAttachmentInputHandle,
  MobileAttachmentInputProps
>(function MobileAttachmentInput(
  { disabled = false, transactionId, onDirtyChange },
  forwardedRef,
) {
  const attachmentsQuery = useTransactionAttachmentsQuery(transactionId);
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const uploadMutation = useUploadTransactionAttachmentMutation();
  const deleteMutation = useDeleteTransactionAttachmentMutation();
  const createAttachmentId = useAttachmentIdFactory();
  const [localAttachments, setLocalAttachments] = useState<LocalAttachment[]>([]);
  const [selectionError, setSelectionError] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();
  const existingAttachments = attachmentsQuery.data ?? [];
  const isUploading = localAttachments.some((item) => item.status === "uploading");

  useEffect(() => {
    onDirtyChange?.(localAttachments.length > 0);
  }, [localAttachments.length, onDirtyChange]);

  const pickAttachments = useCallback(async () => {
    setSelectionError(undefined);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...transactionAttachmentPolicy.acceptedMimeTypes],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const selectedInputs = result.assets.map(documentAssetToMobileAttachment);
      validateMobileAttachments(
        [...localAttachments.map((item) => item.input), ...selectedInputs],
        existingAttachments.length,
      );
      setLocalAttachments((current) => [
        ...current,
        ...selectedInputs.map((input) => ({
          id: createAttachmentId(),
          input,
          status: "selected" as const,
        })),
      ]);
    } catch (error) {
      setSelectionError(attachmentErrorMessage(error));
    }
  }, [createAttachmentId, existingAttachments.length, localAttachments]);

  const removeSelected = useCallback(
    async (attachment: LocalAttachment) => {
      setSelectionError(undefined);
      if (attachment.status === "failed" && transactionId) {
        try {
          await deleteMutation.mutateAsync({
            transactionId,
            attachmentId: attachment.id,
          });
        } catch (error) {
          setLocalAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id
                ? { ...item, error: attachmentErrorMessage(error) }
                : item,
            ),
          );
          return;
        }
      }

      setLocalAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
    },
    [deleteMutation, transactionId],
  );

  const uploadItems = useCallback(
    async (
      items: LocalAttachment[],
      ownerTransactionId: string,
    ): Promise<AttachmentUploadSummary> => {
      const results = await Promise.all(
        items.map(async (item) => {
          setLocalAttachments((current) =>
            current.map((candidate) =>
              candidate.id === item.id
                ? { ...candidate, status: "uploading", progress: 0, error: undefined }
                : candidate,
            ),
          );

          try {
            const uploaded = await uploadMutation.mutateAsync({
              transactionId: ownerTransactionId,
              attachmentId: item.id,
              input: item.input,
              onProgress: (progress) => {
                setLocalAttachments((current) =>
                  current.map((candidate) =>
                    candidate.id === item.id
                      ? { ...candidate, progress }
                      : candidate,
                  ),
                );
              },
            });
            setLocalAttachments((current) =>
              current.filter((candidate) => candidate.id !== item.id),
            );
            return { uploaded } as const;
          } catch (error) {
            const message = attachmentErrorMessage(error);
            setLocalAttachments((current) =>
              current.map((candidate) =>
                candidate.id === item.id
                  ? { ...candidate, status: "failed", error: message }
                  : candidate,
              ),
            );
            return {
              failed: {
                attachmentId: item.id,
                name: item.input.name,
                message,
              },
            } as const;
          }
        }),
      );

      const summary: AttachmentUploadSummary = { uploaded: [], failed: [] };
      for (const result of results) {
        if ("uploaded" in result && result.uploaded) {
          summary.uploaded.push(result.uploaded);
        }
        if ("failed" in result && result.failed) {
          summary.failed.push(result.failed);
        }
      }
      return summary;
    },
    [uploadMutation],
  );

  const uploadPending = useCallback(
    (ownerTransactionId: string) =>
      uploadItems(
        localAttachments.filter((item) => item.status !== "uploading"),
        ownerTransactionId,
      ),
    [localAttachments, uploadItems],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      hasPending: () => localAttachments.length > 0,
      uploadPending,
    }),
    [localAttachments.length, uploadPending],
  );

  const retryAttachment = useCallback(
    async (item: LocalAttachment) => {
      if (!transactionId) return;
      await uploadItems([item], transactionId);
    },
    [transactionId, uploadItems],
  );

  const openAttachment = useCallback(
    async (attachment: MobileTransactionAttachment) => {
      try {
        const refreshed = attachment.downloadUrl
          ? undefined
          : await attachmentsQuery.refetch();
        const downloadUrl =
          attachment.downloadUrl ??
          refreshed?.data?.find((item) => item.id === attachment.id)?.downloadUrl;
        if (!downloadUrl) {
          throw new Error("O arquivo está temporariamente indisponível.");
        }
        await Linking.openURL(downloadUrl);
      } catch (error) {
        Alert.alert("Não foi possível abrir", attachmentErrorMessage(error));
      }
    },
    [attachmentsQuery],
  );

  const deleteAttachment = useCallback(
    (attachment: MobileTransactionAttachment) => {
      Alert.alert(
        "Excluir comprovante?",
        "O arquivo será removido permanentemente.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              setDeletingId(attachment.id);
              void deleteMutation
                .mutateAsync({
                  transactionId: attachment.transactionId,
                  attachmentId: attachment.id,
                })
                .catch((error) => {
                  Alert.alert(
                    "Não foi possível excluir",
                    attachmentErrorMessage(error),
                  );
                })
                .finally(() => setDeletingId(undefined));
            },
          },
        ],
      );
    },
    [deleteMutation],
  );

  const limitReached =
    existingAttachments.length + localAttachments.length >=
    transactionAttachmentPolicy.maximumFiles;

  return (
    <View className="gap-3 rounded-card border border-bytebank-border p-4 dark:border-bytebank-dark-border">
      <View className="flex-row items-center gap-3">
        <Paperclip aria-hidden color={palette.primary} size={20} />
        <View className="min-w-0 flex-1">
          <Text className="font-semibold text-bytebank-text dark:text-bytebank-dark-text">
            Comprovantes
          </Text>
          <Text className="mt-1 text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
            PDF, JPEG ou PNG · até 5 MB · máximo de 5 arquivos
          </Text>
        </View>
      </View>

      {existingAttachments.map((attachment) => (
        <ExistingAttachmentRow
          attachment={attachment}
          deleting={deletingId === attachment.id}
          disabled={disabled || isUploading}
          key={attachment.id}
          onDelete={() => deleteAttachment(attachment)}
          onOpen={() => void openAttachment(attachment)}
        />
      ))}

      {attachmentsQuery.isPending && transactionId ? (
        <View className="flex-row items-center gap-2 py-2">
          <ActivityIndicator color={palette.primary} />
          <Text className="text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
            Carregando comprovantes...
          </Text>
        </View>
      ) : null}

      {attachmentsQuery.isError ? (
        <View accessibilityRole="alert" className="gap-2 rounded-card bg-bytebank-danger/10 p-3">
          <Text className="text-sm text-bytebank-danger dark:text-bytebank-dark-danger">
            Não foi possível listar os comprovantes.
          </Text>
          <Pressable
            accessibilityLabel="Tentar listar comprovantes novamente"
            accessibilityRole="button"
            className="min-h-11 justify-center"
            onPress={() => void attachmentsQuery.refetch()}
          >
            <Text className="font-semibold text-bytebank-primary dark:text-bytebank-dark-primary">
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : null}

      {localAttachments.map((item) => (
        <View
          className="rounded-card border border-bytebank-border bg-bytebank-surface p-3 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
          key={item.id}
        >
          <View className="flex-row items-center gap-3">
            {item.status === "uploading" ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <Upload aria-hidden color={palette.primary} size={18} />
            )}
            <View className="min-w-0 flex-1">
              <Text
                className="font-semibold text-bytebank-text dark:text-bytebank-dark-text"
                numberOfLines={1}
              >
                {item.input.name}
              </Text>
              <Text className="mt-0.5 text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
                {formattedSize(item.input.size)}
                {item.status === "uploading"
                  ? ` · ${item.progress ?? 0}%`
                  : item.status === "failed"
                    ? " · falhou"
                    : " · selecionado"}
              </Text>
            </View>
            {item.status === "failed" && transactionId ? (
              <Pressable
                accessibilityLabel={`Tentar enviar ${item.input.name} novamente`}
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-full"
                disabled={disabled || isUploading}
                accessibilityState={{ disabled: disabled || isUploading }}
                onPress={() => void retryAttachment(item)}
              >
                <RotateCcw aria-hidden color={palette.primary} size={19} />
              </Pressable>
            ) : null}
            {item.status !== "uploading" ? (
              <Pressable
                accessibilityLabel={`Remover ${item.input.name} da seleção`}
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-full"
                disabled={disabled}
                accessibilityState={{ disabled }}
                onPress={() => void removeSelected(item)}
              >
                <X aria-hidden color={palette.danger} size={19} />
              </Pressable>
            ) : null}
          </View>
          {item.status === "uploading" ? (
            <View
              accessibilityLabel={`Progresso de ${item.input.name}: ${item.progress ?? 0}%`}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: item.progress ?? 0,
              }}
              className="mt-3 h-2 overflow-hidden rounded-full bg-bytebank-border dark:bg-bytebank-dark-border"
            >
              <View
                className="h-full rounded-full bg-bytebank-primary dark:bg-bytebank-dark-primary"
                style={{ width: `${item.progress ?? 0}%` }}
              />
            </View>
          ) : null}
          {item.error ? (
            <Text accessibilityRole="alert" className="mt-2 text-xs text-bytebank-danger dark:text-bytebank-dark-danger">
              {item.error}
            </Text>
          ) : null}
        </View>
      ))}

      {selectionError ? (
        <Text accessibilityRole="alert" className="text-sm text-bytebank-danger dark:text-bytebank-dark-danger">
          {selectionError}
        </Text>
      ) : null}

      <Pressable
        accessibilityLabel="Selecionar comprovantes"
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || isUploading || limitReached }}
        className={`min-h-12 items-center justify-center rounded-card border border-dashed border-bytebank-primary ${
          disabled || isUploading || limitReached ? "opacity-50" : "active:bg-bytebank-primary/10"
        }`}
        disabled={disabled || isUploading || limitReached}
        onPress={() => void pickAttachments()}
      >
        <Text className="font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
          {limitReached ? "Limite de 5 arquivos atingido" : "Selecionar arquivos"}
        </Text>
      </Pressable>
    </View>
  );
});
