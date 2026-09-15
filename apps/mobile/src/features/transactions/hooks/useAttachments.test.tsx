import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import {
  dashboardQueryKeys,
  transactionAttachmentQueryKeys,
  transactionQueryKeys,
} from "@mobile/services/query/queryKeys";
import type { AttachmentsRepository } from "../types/attachments";
import {
  useDeleteTransactionAttachmentMutation,
  useUploadTransactionAttachmentMutation,
} from "./useAttachments";

jest.mock("@mobile/providers/AuthContext", () => ({
  useAuth: () => ({ session: { uid: "uid-1" } }),
}));

function repositoryMock(): jest.Mocked<AttachmentsRepository> {
  return {
    createId: jest.fn(() => "attachment-1"),
    list: jest.fn(),
    upload: jest.fn(),
    remove: jest.fn(),
  };
}

function testContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const uploadedAttachment = {
  id: "attachment-1",
  transactionId: "tx-1",
  name: "receipt.pdf",
  mimeType: "application/pdf",
  size: 1024,
  storagePath: "users/uid-1/transactions/tx-1/attachment-1-receipt.pdf",
  status: "ready" as const,
  createdAt: "2026-09-14T00:00:00.000Z",
};

describe("attachment hooks", () => {
  it("autoriza o upload com o UID da sessão e invalida os dados afetados", async () => {
    const repository = repositoryMock();
    repository.upload.mockResolvedValue(uploadedAttachment);
    const { queryClient, wrapper } = testContext();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useUploadTransactionAttachmentMutation({ repository }),
      { wrapper },
    );
    const variables = {
      transactionId: "tx-1",
      attachmentId: "attachment-1",
      input: {
        uri: "file:///receipt.pdf",
        name: "receipt.pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    };

    await act(async () => {
      await result.current.mutateAsync(variables);
    });

    expect(repository.upload).toHaveBeenCalledWith("uid-1", variables);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: transactionAttachmentQueryKeys.byTransaction("uid-1", "tx-1"),
      });
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: transactionQueryKeys.detail("uid-1", "tx-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all("uid-1"),
    });
  });

  it("exclui com o UID da sessão e sincroniza o cache", async () => {
    const repository = repositoryMock();
    repository.remove.mockResolvedValue(undefined);
    const { queryClient, wrapper } = testContext();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useDeleteTransactionAttachmentMutation({ repository }),
      { wrapper },
    );
    const variables = {
      transactionId: "tx-1",
      attachmentId: "attachment-1",
    };

    await act(async () => {
      await result.current.mutateAsync(variables);
    });

    expect(repository.remove).toHaveBeenCalledWith("uid-1", variables);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: transactionAttachmentQueryKeys.byTransaction("uid-1", "tx-1"),
      });
    });
  });
});
