import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

import type { TransactionInput } from "../types/transactions";
import { FirebaseAttachmentsRepository } from "./FirebaseAttachmentsRepository";
import { FirebaseTransactionsRepository } from "./FirebaseTransactionsRepository";

const projectId = "demo-bytebank";
const host = process.env.FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
const password = "ByteBank123!";

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;
let uid: string;

const expenseInput: TransactionInput = {
  amountInCents: 28_590,
  category: "Alimentação",
  categoryId: "groceries",
  date: "2026-09-08",
  description: "Supermercado integração",
  observation: "Criada pelo Jest contra o Emulator Suite",
  status: "completed",
  type: "expense",
};

beforeAll(async () => {
  app = initializeApp(
    {
      apiKey: "demo-bytebank-api-key",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      appId: `1:000000000000:web:jest-${Date.now()}`,
    },
    `mobile-emulator-${Date.now()}`,
  );
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(firestore, host, 8080);
  connectStorageEmulator(storage, host, 9199);

  const email = `mobile-jest-${Date.now()}@bytebank.test`;
  const created = await createUserWithEmailAndPassword(auth, email, password);
  uid = created.user.uid;
  await signOut(auth);
  const authenticated = await signInWithEmailAndPassword(auth, email, password);
  expect(authenticated.user.uid).toBe(uid);
});

afterAll(async () => {
  if (auth.currentUser) await deleteUser(auth.currentUser);
  await deleteApp(app);
});

describe("mobile repositories with Firebase Emulator Suite", () => {
  it("creates, filters, paginates, updates, uploads, removes and deletes", async () => {
    const transactions = new FirebaseTransactionsRepository(firestore);
    const attachments = new FirebaseAttachmentsRepository(firestore, storage);
    const first = await transactions.create(uid, expenseInput);
    const second = await transactions.create(uid, {
      ...expenseInput,
      amountInCents: 750_000,
      category: "Salário",
      categoryId: "salary",
      date: "2026-09-09",
      description: "Salário integração",
      type: "income",
    });

    const firstPage = await transactions.list(uid, {
      pageSize: 1,
      sort: "date-desc",
    });
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.nextCursor).toBeDefined();
    const secondPage = await transactions.list(
      uid,
      { pageSize: 1, sort: "date-desc" },
      firstPage.nextCursor,
    );
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);

    const filtered = await transactions.list(uid, {
      pageSize: 20,
      sort: "date-desc",
      type: "income",
    });
    expect(filtered.items.map((item) => item.id)).toContain(second.id);
    expect(filtered.items.map((item) => item.id)).not.toContain(first.id);

    const updated = await transactions.update(uid, first.id, {
      ...expenseInput,
      description: "Supermercado atualizado",
    });
    expect(updated.description).toBe("Supermercado atualizado");

    const attachmentId = attachments.createId();
    const uploaded = await attachments.upload(uid, {
      transactionId: first.id,
      attachmentId,
      input: {
        uri: "data:application/pdf;base64,JVBERi0xLjQKJSVFT0YK",
        name: "comprovante.pdf",
        mimeType: "application/pdf",
        size: 15,
      },
    });
    expect(uploaded.status).toBe("ready");
    await expect(transactions.delete(uid, first.id)).rejects.toThrow(
      "Remova todos os comprovantes",
    );

    const listedAttachments = await attachments.list(uid, first.id);
    expect(listedAttachments).toHaveLength(1);
    expect(listedAttachments[0]?.name).toBe("comprovante.pdf");
    await attachments.remove(uid, {
      transactionId: first.id,
      attachmentId,
    });
    await expect(attachments.list(uid, first.id)).resolves.toEqual([]);

    await transactions.delete(uid, first.id);
    await transactions.delete(uid, second.id);
    await expect(transactions.getById(uid, first.id)).rejects.toMatchObject({
      code: "not-found",
    });
  }, 30_000);
});
