import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@mobile/providers/AuthContext";
import {
  dashboardQueryKeys,
  transactionAttachmentQueryKeys,
  transactionQueryKeys,
} from "@mobile/services/query/queryKeys";
import {
  getFirebaseAttachmentsRepository,
  requireAuthenticatedUid,
} from "../data";
import type {
  AttachmentsRepository,
  DeleteAttachmentVariables,
  UploadAttachmentVariables,
} from "../types/attachments";

interface AttachmentHookOptions {
  enabled?: boolean;
  repository?: AttachmentsRepository;
}

function selectedRepository(repository?: AttachmentsRepository) {
  return repository ?? getFirebaseAttachmentsRepository();
}

export function useTransactionAttachmentsQuery(
  transactionId: string | undefined,
  options: AttachmentHookOptions = {},
) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";
  const repository = selectedRepository(options.repository);

  return useQuery({
    queryKey: transactionAttachmentQueryKeys.byTransaction(
      uid,
      transactionId ?? "",
    ),
    queryFn: () =>
      repository.list(
        requireAuthenticatedUid(uid, "read"),
        transactionId ?? "",
      ),
    enabled: Boolean(uid && transactionId) && (options.enabled ?? true),
  });
}

function useSynchronizeAttachments() {
  const queryClient = useQueryClient();

  return async (uid: string, transactionId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: transactionAttachmentQueryKeys.byTransaction(uid, transactionId),
      }),
      queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.detail(uid, transactionId),
      }),
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists(uid) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all(uid) }),
    ]);
  };
}

export function useUploadTransactionAttachmentMutation(
  options: Pick<AttachmentHookOptions, "repository"> = {},
) {
  const { session } = useAuth();
  const synchronize = useSynchronizeAttachments();
  const repository = selectedRepository(options.repository);

  return useMutation({
    mutationFn: (variables: UploadAttachmentVariables) =>
      repository.upload(
        requireAuthenticatedUid(session?.uid, "create"),
        variables,
      ),
    onSuccess: (_attachment, variables) =>
      synchronize(
        requireAuthenticatedUid(session?.uid, "create"),
        variables.transactionId,
      ),
  });
}

export function useDeleteTransactionAttachmentMutation(
  options: Pick<AttachmentHookOptions, "repository"> = {},
) {
  const { session } = useAuth();
  const synchronize = useSynchronizeAttachments();
  const repository = selectedRepository(options.repository);

  return useMutation({
    mutationFn: (variables: DeleteAttachmentVariables) =>
      repository.remove(
        requireAuthenticatedUid(session?.uid, "delete"),
        variables,
      ),
    onSuccess: (_result, variables) =>
      synchronize(
        requireAuthenticatedUid(session?.uid, "delete"),
        variables.transactionId,
      ),
  });
}

export function useAttachmentIdFactory(
  options: Pick<AttachmentHookOptions, "repository"> = {},
) {
  const repository = selectedRepository(options.repository);
  return () => repository.createId();
}
