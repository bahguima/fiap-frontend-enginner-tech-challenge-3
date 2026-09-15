import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
} from "firebase/storage";

import { transactionAttachmentPolicy } from "@banking/shared/types";
import { getFirebaseServices } from "@mobile/services/firebase";
import type {
  AttachmentsRepository,
  DeleteAttachmentVariables,
  MobileTransactionAttachment,
  UploadAttachmentVariables,
} from "../types/attachments";
import { requireAuthenticatedUid } from "./transactionErrors";
import { validateMobileAttachments } from "./attachmentValidation";

const SAFE_FILE_NAME_MAXIMUM_LENGTH = 120;

function validateIdentifier(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.includes("/")) {
    throw new Error(`${label} inválido.`);
  }
  return normalized;
}

export function safeAttachmentName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
  const baseName = (dotIndex >= 0 ? name.slice(0, dotIndex) : name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SAFE_FILE_NAME_MAXIMUM_LENGTH - extension.length);

  return `${baseName || "comprovante"}${extension}`;
}

function timestampIso(value: unknown): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate(): Date }).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function metadataFromSnapshot(
  snapshot:
    | QueryDocumentSnapshot<DocumentData>
    | { id: string; data(): DocumentData | undefined },
  transactionId: string,
): MobileTransactionAttachment {
  const value = snapshot.data();
  if (
    !value ||
    typeof value.fileName !== "string" ||
    typeof value.contentType !== "string" ||
    typeof value.sizeInBytes !== "number" ||
    typeof value.storagePath !== "string" ||
    (value.status !== "pending" && value.status !== "ready" && value.status !== "failed")
  ) {
    throw new Error("Os metadados do comprovante são inválidos.");
  }

  return {
    id: snapshot.id,
    transactionId,
    name: value.fileName,
    mimeType: value.contentType,
    size: value.sizeInBytes,
    storagePath: value.storagePath,
    status: value.status,
    createdAt: timestampIso(value.createdAt),
  };
}

function isStorageObjectMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "storage/object-not-found"
  );
}

export class FirebaseAttachmentsRepository implements AttachmentsRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly storage: FirebaseStorage,
  ) {}

  createId(): string {
    return doc(collection(this.firestore, "attachmentIds")).id;
  }

  private transactionReference(uid: string, transactionId: string) {
    return doc(this.firestore, "users", uid, "transactions", transactionId);
  }

  private attachmentCollection(uid: string, transactionId: string) {
    return collection(
      this.firestore,
      "users",
      uid,
      "transactions",
      transactionId,
      "attachments",
    );
  }

  async list(uid: string, transactionId: string): Promise<MobileTransactionAttachment[]> {
    const ownerUid = requireAuthenticatedUid(uid, "read");
    const validTransactionId = validateIdentifier(transactionId, "Identificador da transação");
    const snapshot = await getDocs(
      query(
        this.attachmentCollection(ownerUid, validTransactionId),
        orderBy("createdAt", "desc"),
      ),
    );

    return Promise.all(
      snapshot.docs.map(async (item) => {
        const attachment = metadataFromSnapshot(item, validTransactionId);
        if (attachment.status !== "ready") return attachment;

        try {
          return {
            ...attachment,
            downloadUrl: await getDownloadURL(ref(this.storage, attachment.storagePath)),
          };
        } catch {
          return attachment;
        }
      }),
    );
  }

  async upload(
    uid: string,
    variables: UploadAttachmentVariables,
  ): Promise<MobileTransactionAttachment> {
    const ownerUid = requireAuthenticatedUid(uid, "create");
    const transactionId = validateIdentifier(
      variables.transactionId,
      "Identificador da transação",
    );
    const attachmentId = validateIdentifier(
      variables.attachmentId,
      "Identificador do comprovante",
    );
    const [input] = validateMobileAttachments([variables.input]);
    const safeName = safeAttachmentName(input.name);
    const storagePath =
      `users/${ownerUid}/transactions/${transactionId}/` +
      `${attachmentId}-${safeName}`;
    const transactionReference = this.transactionReference(ownerUid, transactionId);
    const attachmentReference = doc(
      this.attachmentCollection(ownerUid, transactionId),
      attachmentId,
    );

    const response = await fetch(input.uri);
    const blob = await response.blob();
    validateMobileAttachments([{ ...input, size: blob.size }]);

    const alreadyReady = await runTransaction(this.firestore, async (transaction) => {
      const [transactionSnapshot, attachmentSnapshot] = await Promise.all([
        transaction.get(transactionReference),
        transaction.get(attachmentReference),
      ]);

      if (!transactionSnapshot.exists()) {
        throw new Error("A transação não existe mais.");
      }

      if (attachmentSnapshot.exists()) {
        const current = metadataFromSnapshot(attachmentSnapshot, transactionId);
        if (
          current.name !== input.name ||
          current.mimeType !== input.mimeType ||
          current.storagePath !== storagePath
        ) {
          throw new Error("O identificador deste comprovante já está em uso.");
        }
        if (current.status === "ready") return true;

        transaction.update(attachmentReference, {
          sizeInBytes: blob.size,
          status: "pending",
          updatedAt: serverTimestamp(),
        });
        return false;
      }

      const attachmentCount = transactionSnapshot.data().attachmentCount;
      if (
        !Number.isInteger(attachmentCount) ||
        attachmentCount < 0 ||
        attachmentCount >= transactionAttachmentPolicy.maximumFiles
      ) {
        throw new Error("Cada transação pode ter no máximo 5 anexos.");
      }

      transaction.set(attachmentReference, {
        fileName: input.name,
        contentType: input.mimeType,
        sizeInBytes: blob.size,
        storagePath,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(transactionReference, {
        attachmentCount: attachmentCount + 1,
        updatedAt: serverTimestamp(),
      });
      return false;
    });

    if (alreadyReady) {
      const currentSnapshot = await getDoc(attachmentReference);
      const current = metadataFromSnapshot(currentSnapshot, transactionId);
      return {
        ...current,
        downloadUrl: await getDownloadURL(ref(this.storage, current.storagePath)),
      };
    }

    const objectReference = ref(this.storage, storagePath);
    try {
      const uploadTask = uploadBytesResumable(objectReference, blob, {
        contentType: input.mimeType,
        customMetadata: {
          attachmentId,
          originalName: input.name,
          transactionId,
        },
      });

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              variables.onProgress?.(
                Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
              );
            }
          },
          reject,
          resolve,
        );
      });

      try {
        await updateDoc(attachmentReference, {
          sizeInBytes: blob.size,
          status: "ready",
          updatedAt: serverTimestamp(),
        });
      } catch (metadataError) {
        try {
          await deleteObject(objectReference);
        } catch {
          // Best-effort compensation: a later cleanup may remove the orphan.
        }
        try {
          await updateDoc(attachmentReference, {
            status: "failed",
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Preserve the original metadata error.
        }
        throw metadataError;
      }

      return {
        id: attachmentId,
        transactionId,
        name: input.name,
        mimeType: input.mimeType,
        size: blob.size,
        storagePath,
        status: "ready",
        createdAt: new Date().toISOString(),
        downloadUrl: await getDownloadURL(objectReference),
      };
    } catch (error) {
      try {
        await updateDoc(attachmentReference, {
          status: "failed",
          updatedAt: serverTimestamp(),
        });
      } catch {
        // The upload error remains the actionable failure.
      }
      throw error;
    } finally {
      if ("close" in blob && typeof blob.close === "function") blob.close();
    }
  }

  async remove(uid: string, variables: DeleteAttachmentVariables): Promise<void> {
    const ownerUid = requireAuthenticatedUid(uid, "delete");
    const transactionId = validateIdentifier(
      variables.transactionId,
      "Identificador da transação",
    );
    const attachmentId = validateIdentifier(
      variables.attachmentId,
      "Identificador do comprovante",
    );
    const transactionReference = this.transactionReference(ownerUid, transactionId);
    const attachmentReference = doc(
      this.attachmentCollection(ownerUid, transactionId),
      attachmentId,
    );
    const snapshot = await getDoc(attachmentReference);
    if (!snapshot.exists()) return;

    const attachment = metadataFromSnapshot(snapshot, transactionId);
    const expectedPrefix = `users/${ownerUid}/transactions/${transactionId}/`;
    if (!attachment.storagePath.startsWith(expectedPrefix)) {
      throw new Error("O caminho do comprovante é inválido.");
    }

    try {
      await deleteObject(ref(this.storage, attachment.storagePath));
    } catch (error) {
      if (!isStorageObjectMissing(error)) throw error;
    }

    await runTransaction(this.firestore, async (transaction) => {
      const [currentAttachment, currentTransaction] = await Promise.all([
        transaction.get(attachmentReference),
        transaction.get(transactionReference),
      ]);
      if (!currentAttachment.exists()) return;

      transaction.delete(attachmentReference);
      if (currentTransaction.exists()) {
        const count = currentTransaction.data().attachmentCount;
        transaction.update(transactionReference, {
          attachmentCount:
            Number.isInteger(count) && count > 0 ? count - 1 : 0,
          updatedAt: serverTimestamp(),
        });
      }
    });
  }
}

let repository: FirebaseAttachmentsRepository | undefined;

export function getFirebaseAttachmentsRepository(): FirebaseAttachmentsRepository {
  const services = getFirebaseServices();
  repository ??= new FirebaseAttachmentsRepository(
    services.firestore,
    services.storage,
  );
  return repository;
}
