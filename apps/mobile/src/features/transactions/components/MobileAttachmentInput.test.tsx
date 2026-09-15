import * as DocumentPicker from "expo-document-picker";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createRef } from "react";
import { Alert } from "react-native";

import {
  useAttachmentIdFactory,
  useDeleteTransactionAttachmentMutation,
  useTransactionAttachmentsQuery,
  useUploadTransactionAttachmentMutation,
} from "../hooks";
import { renderWithTheme } from "@mobile/test/render";
import {
  MobileAttachmentInput,
  type MobileAttachmentInputHandle,
} from "./MobileAttachmentInput";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("../hooks", () => ({
  useAttachmentIdFactory: jest.fn(),
  useDeleteTransactionAttachmentMutation: jest.fn(),
  useTransactionAttachmentsQuery: jest.fn(),
  useUploadTransactionAttachmentMutation: jest.fn(),
}));

const mockPicker = jest.mocked(DocumentPicker.getDocumentAsync);
const mockUseIdFactory = jest.mocked(useAttachmentIdFactory);
const mockUseDeleteMutation = jest.mocked(
  useDeleteTransactionAttachmentMutation,
);
const mockUseAttachmentsQuery = jest.mocked(useTransactionAttachmentsQuery);
const mockUseUploadMutation = jest.mocked(
  useUploadTransactionAttachmentMutation,
);

const pdfAsset = {
  uri: "file:///receipt.pdf",
  name: "receipt.pdf",
  mimeType: "application/pdf",
  size: 2048,
} as DocumentPicker.DocumentPickerAsset;

function pickerResult(
  assets: DocumentPicker.DocumentPickerAsset[],
): DocumentPicker.DocumentPickerResult {
  return { canceled: false, assets };
}

const existingAttachment = {
  id: "remote-1",
  transactionId: "tx-1",
  name: "existente.pdf",
  mimeType: "application/pdf",
  size: 1024,
  storagePath: "users/uid-1/transactions/tx-1/remote-1-existente.pdf",
  status: "ready" as const,
  createdAt: "2026-09-14T00:00:00.000Z",
  downloadUrl: "https://example.test/existente.pdf",
};

let uploadAsync: jest.Mock;
let deleteAsync: jest.Mock;
let idCounter: number;

function queryMock(data: typeof existingAttachment[] = []) {
  return {
    data,
    isPending: false,
    isError: false,
    refetch: jest.fn().mockResolvedValue(undefined),
  } as never;
}

beforeEach(() => {
  idCounter = 0;
  uploadAsync = jest.fn().mockImplementation(async (variables) => ({
    id: variables.attachmentId,
    transactionId: variables.transactionId,
    name: variables.input.name,
    mimeType: variables.input.mimeType,
    size: variables.input.size,
    storagePath: `path/${variables.attachmentId}`,
    status: "ready",
    createdAt: "2026-09-14T00:00:00.000Z",
  }));
  deleteAsync = jest.fn().mockResolvedValue(undefined);
  mockUseIdFactory.mockReturnValue(() => `local-${++idCounter}`);
  mockUseUploadMutation.mockReturnValue({ mutateAsync: uploadAsync } as never);
  mockUseDeleteMutation.mockReturnValue({ mutateAsync: deleteAsync } as never);
  mockUseAttachmentsQuery.mockReturnValue(queryMock());
  mockPicker.mockResolvedValue({ canceled: true, assets: null });
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("MobileAttachmentInput", () => {
  it("seleciona, lista e remove um arquivo antes do envio", async () => {
    mockPicker.mockResolvedValue(pickerResult([pdfAsset]));
    renderWithTheme(<MobileAttachmentInput />);

    fireEvent.press(screen.getByRole("button", { name: "Selecionar comprovantes" }));

    expect(await screen.findByText("receipt.pdf")).toBeOnTheScreen();
    expect(screen.getByText("2.0 KB · selecionado")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", {
        name: "Remover receipt.pdf da seleção",
      }),
    );
    expect(screen.queryByText("receipt.pdf")).not.toBeOnTheScreen();
  });

  it.each([
    [
      "MIME",
      { ...pdfAsset, mimeType: "text/plain" },
      "Envie apenas arquivos PDF, JPEG ou PNG.",
    ],
    [
      "tamanho",
      { ...pdfAsset, size: 5 * 1024 * 1024 + 1 },
      "Cada arquivo deve ter no máximo 5 MB.",
    ],
    [
      "arquivo vazio",
      { ...pdfAsset, size: 0 },
      "Não é possível anexar um arquivo vazio.",
    ],
  ])("rejeita %s inválido na seleção", async (_label, asset, message) => {
    mockPicker.mockResolvedValue(
      pickerResult([asset as DocumentPicker.DocumentPickerAsset]),
    );
    renderWithTheme(<MobileAttachmentInput />);

    fireEvent.press(screen.getByRole("button", { name: "Selecionar comprovantes" }));

    expect(await screen.findByText(message)).toBeOnTheScreen();
    expect(screen.queryByText("2.0 KB · selecionado")).not.toBeOnTheScreen();
  });

  it("considera anexos existentes ao validar a quantidade", async () => {
    mockUseAttachmentsQuery.mockReturnValue(
      queryMock([
        existingAttachment,
        { ...existingAttachment, id: "remote-2" },
        { ...existingAttachment, id: "remote-3" },
        { ...existingAttachment, id: "remote-4" },
      ]),
    );
    mockPicker.mockResolvedValue(
      pickerResult([
        pdfAsset,
        { ...pdfAsset, uri: "file:///second.pdf", name: "second.pdf" },
      ]),
    );
    renderWithTheme(<MobileAttachmentInput transactionId="tx-1" />);

    fireEvent.press(screen.getByRole("button", { name: "Selecionar comprovantes" }));

    expect(
      await screen.findByText("Cada transação pode ter no máximo 5 anexos."),
    ).toBeOnTheScreen();
    expect(screen.queryByText("receipt.pdf")).not.toBeOnTheScreen();
  });

  it("envia o objeto mobile e repassa progresso do upload", async () => {
    const inputRef = createRef<MobileAttachmentInputHandle>();
    let finishUpload: (() => void) | undefined;
    uploadAsync.mockImplementation(
      (variables) =>
        new Promise((resolve) => {
          variables.onProgress?.(45);
          finishUpload = () =>
            resolve({
              id: variables.attachmentId,
              transactionId: variables.transactionId,
              name: variables.input.name,
              mimeType: variables.input.mimeType,
              size: variables.input.size,
              storagePath: "path/local-1",
              status: "ready",
              createdAt: "2026-09-14T00:00:00.000Z",
            });
        }),
    );
    mockPicker.mockResolvedValue(pickerResult([pdfAsset]));
    renderWithTheme(<MobileAttachmentInput ref={inputRef} />);
    fireEvent.press(screen.getByRole("button", { name: "Selecionar comprovantes" }));
    await screen.findByText("receipt.pdf");

    let uploadPromise: Promise<unknown> | undefined;
    await act(async () => {
      uploadPromise = inputRef.current?.uploadPending("tx-1");
    });

    expect(uploadAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "tx-1",
        attachmentId: "local-1",
        input: pdfAsset,
        onProgress: expect.any(Function),
      }),
    );
    expect(screen.getByLabelText("Progresso de receipt.pdf: 45%")).toBeOnTheScreen();

    await act(async () => {
      finishUpload?.();
      await uploadPromise;
    });
  });

  it("retorna sucesso parcial e permite retry individual somente do item com falha", async () => {
    const inputRef = createRef<MobileAttachmentInputHandle>();
    const secondAsset = {
      ...pdfAsset,
      uri: "file:///second.png",
      name: "second.png",
      mimeType: "image/png",
    };
    uploadAsync
      .mockResolvedValueOnce({
        ...existingAttachment,
        id: "local-1",
        transactionId: "tx-1",
      })
      .mockRejectedValueOnce(new Error("Sem conexão"))
      .mockResolvedValueOnce({
        ...existingAttachment,
        id: "local-2",
        transactionId: "tx-1",
        name: "second.png",
      });
    mockPicker.mockResolvedValue(
      pickerResult([pdfAsset, secondAsset as DocumentPicker.DocumentPickerAsset]),
    );
    renderWithTheme(
      <MobileAttachmentInput ref={inputRef} transactionId="tx-1" />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Selecionar comprovantes" }));
    await screen.findByText("second.png");

    let summary;
    await act(async () => {
      summary = await inputRef.current?.uploadPending("tx-1");
    });

    expect(summary).toMatchObject({
      uploaded: [expect.objectContaining({ id: "local-1" })],
      failed: [expect.objectContaining({ attachmentId: "local-2" })],
    });
    expect(screen.getByText("Sem conexão")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", {
        name: "Tentar enviar second.png novamente",
      }),
    );

    await waitFor(() => expect(uploadAsync).toHaveBeenCalledTimes(3));
    expect(uploadAsync.mock.calls[2][0]).toEqual(
      expect.objectContaining({ attachmentId: "local-2" }),
    );
  });

  it("confirma e exclui um anexo existente", async () => {
    mockUseAttachmentsQuery.mockReturnValue(queryMock([existingAttachment]));
    renderWithTheme(<MobileAttachmentInput transactionId="tx-1" />);

    fireEvent.press(
      screen.getByRole("button", { name: "Excluir existente.pdf" }),
    );

    const buttons = jest.mocked(Alert.alert).mock.calls[0][2];
    await act(async () => {
      buttons?.[1]?.onPress?.();
    });
    expect(deleteAsync).toHaveBeenCalledWith({
      transactionId: "tx-1",
      attachmentId: "remote-1",
    });
  });

  it("remove a reserva remota ao descartar um upload que falhou", async () => {
    const inputRef = createRef<MobileAttachmentInputHandle>();
    uploadAsync.mockRejectedValueOnce(new Error("Sem conexão"));
    mockPicker.mockResolvedValue(pickerResult([pdfAsset]));
    renderWithTheme(
      <MobileAttachmentInput ref={inputRef} transactionId="tx-1" />,
    );
    fireEvent.press(screen.getByRole("button", { name: "Selecionar comprovantes" }));
    await screen.findByText("receipt.pdf");
    await act(async () => {
      await inputRef.current?.uploadPending("tx-1");
    });

    fireEvent.press(
      screen.getByRole("button", {
        name: "Remover receipt.pdf da seleção",
      }),
    );

    await waitFor(() => {
      expect(deleteAsync).toHaveBeenCalledWith({
        transactionId: "tx-1",
        attachmentId: "local-1",
      });
    });
    expect(screen.queryByText("receipt.pdf")).not.toBeOnTheScreen();
  });
});
