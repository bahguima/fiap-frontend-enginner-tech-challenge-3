import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, test } from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";

const projectId = "demo-bytebank";
const ownerUid = "owner-user";
const otherUid = "other-user";
const transactionId = "transaction-1";
const attachmentId = "attachment-1";
const validObjectPath =
  `users/${ownerUid}/transactions/${transactionId}/` +
  `${attachmentId}-receipt.pdf`;

let testEnvironment;

function validTransaction(overrides = {}) {
  const timestamp = Timestamp.fromMillis(1);

  return {
    description: "Supermercado",
    descriptionNormalized: "supermercado",
    observation: "Compra mensal",
    amountInCents: 1000,
    incomeAmountInCents: 0,
    expenseAmountInCents: 1000,
    type: "expense",
    categoryId: "groceries",
    categoryName: "Alimentação",
    occurredOn: "2026-09-08",
    status: "completed",
    attachmentCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    schemaVersion: 1,
    ...overrides,
  };
}

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    readFile(new URL("../storage.rules", import.meta.url), "utf8"),
  ]);

  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { host: "127.0.0.1", port: 8080, rules: firestoreRules },
    storage: { host: "127.0.0.1", port: 9199, rules: storageRules },
  });
});

beforeEach(async () => {
  await Promise.all([
    testEnvironment.clearFirestore(),
    testEnvironment.clearStorage(),
  ]);
});

after(async () => {
  await testEnvironment?.cleanup();
});

describe("Cloud Firestore rules", () => {
  test("deny unauthenticated access", async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore();
    const userReference = doc(firestore, "users", ownerUid);

    await assertFails(setDoc(userReference, { displayName: "Anonymous" }));
    await assertFails(getDoc(userReference));
  });

  test("allow an authenticated user to access only their user document", async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(ownerUid)
      .firestore();
    const ownerReference = doc(ownerFirestore, "users", ownerUid);
    const otherReference = doc(ownerFirestore, "users", otherUid);

    await assertSucceeds(setDoc(ownerReference, { displayName: "Owner" }));
    await assertSucceeds(getDoc(ownerReference));
    await assertFails(setDoc(otherReference, { displayName: "Intruder" }));
    await assertFails(getDoc(otherReference));
  });

  test("isolate transactions and their attachment metadata by uid", async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(ownerUid)
      .firestore();
    const otherFirestore = testEnvironment
      .authenticatedContext(otherUid)
      .firestore();
    const transactionPath =
      `users/${ownerUid}/transactions/${transactionId}`;
    const attachmentPath = `${transactionPath}/attachments/${attachmentId}`;

    await assertSucceeds(
      setDoc(doc(ownerFirestore, transactionPath), validTransaction()),
    );
    await assertSucceeds(
      setDoc(doc(ownerFirestore, attachmentPath), {
        fileName: "receipt.pdf",
        contentType: "application/pdf",
        sizeInBytes: 16,
        storagePath: validObjectPath,
        status: "ready",
        createdAt: Timestamp.fromMillis(1),
        updatedAt: Timestamp.fromMillis(1),
      }),
    );
    await assertFails(getDoc(doc(otherFirestore, transactionPath)));
    await assertFails(getDoc(doc(otherFirestore, attachmentPath)));
  });

  test("validate transaction fields, enums, derived amounts and immutable creation time", async () => {
    const firestore = testEnvironment
      .authenticatedContext(ownerUid)
      .firestore();
    const reference = doc(
      firestore,
      "users",
      ownerUid,
      "transactions",
      transactionId,
    );

    await assertSucceeds(setDoc(reference, validTransaction()));
    await assertSucceeds(
      setDoc(
        reference,
        validTransaction({
          description: "Supermercado atualizado",
          descriptionNormalized: "supermercado atualizado",
          updatedAt: Timestamp.fromMillis(2),
        }),
      ),
    );
    await assertFails(
      setDoc(reference, validTransaction({ status: "unknown" })),
    );
    await assertFails(
      setDoc(
        reference,
        validTransaction({
          incomeAmountInCents: 1000,
          expenseAmountInCents: 1000,
        }),
      ),
    );
    await assertFails(
      setDoc(
        reference,
        validTransaction({ createdAt: Timestamp.fromMillis(3) }),
      ),
    );
    await assertFails(
      setDoc(reference, { ...validTransaction(), unexpected: true }),
    );
  });

  test("allow authenticated category reads but deny client writes", async () => {
    const categoryPath = "transactionCategories/groceries";

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), categoryPath), {
        name: "Alimentação",
        type: "expense",
      });
    });

    const ownerFirestore = testEnvironment
      .authenticatedContext(ownerUid)
      .firestore();
    const anonymousFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertSucceeds(getDoc(doc(ownerFirestore, categoryPath)));
    await assertFails(getDoc(doc(anonymousFirestore, categoryPath)));
    await assertFails(
      setDoc(doc(ownerFirestore, categoryPath), {
        name: "Alterada pelo cliente",
        type: "expense",
      }),
    );
  });

  test("deny documents outside the supported hierarchy", async () => {
    const firestore = testEnvironment
      .authenticatedContext(ownerUid)
      .firestore();

    await assertFails(
      setDoc(doc(firestore, "admin", ownerUid), { role: "admin" }),
    );
  });
});

describe("Cloud Storage rules", () => {
  const validPdf = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");

  test("deny unauthenticated uploads and reads", async () => {
    const storage = testEnvironment.unauthenticatedContext().storage();
    const objectReference = ref(storage, validObjectPath);

    await assertFails(
      uploadBytes(objectReference, validPdf, { contentType: "application/pdf" }),
    );
    await assertFails(getBytes(objectReference));
  });

  test("allow the owner to upload and read an accepted file", async () => {
    const storage = testEnvironment.authenticatedContext(ownerUid).storage();
    const objectReference = ref(storage, validObjectPath);

    await assertSucceeds(
      uploadBytes(objectReference, validPdf, { contentType: "application/pdf" }),
    );
    const bytes = await assertSucceeds(getBytes(objectReference));

    assert.equal(bytes.byteLength, validPdf.byteLength);
  });

  test("deny access to another user's path", async () => {
    const storage = testEnvironment.authenticatedContext(otherUid).storage();
    const objectReference = ref(storage, validObjectPath);

    await assertFails(
      uploadBytes(objectReference, validPdf, { contentType: "application/pdf" }),
    );
    await assertFails(getBytes(objectReference));
  });

  test("allow only the owner to delete an attachment", async () => {
    const ownerStorage = testEnvironment.authenticatedContext(ownerUid).storage();
    const otherStorage = testEnvironment.authenticatedContext(otherUid).storage();
    const objectReference = ref(ownerStorage, validObjectPath);

    await assertSucceeds(
      uploadBytes(objectReference, validPdf, { contentType: "application/pdf" }),
    );
    await assertFails(
      deleteObject(ref(otherStorage, validObjectPath)),
    );
    await assertSucceeds(deleteObject(objectReference));
  });

  test("deny unsupported MIME types", async () => {
    const storage = testEnvironment.authenticatedContext(ownerUid).storage();

    await assertFails(
      uploadBytes(ref(storage, validObjectPath), validPdf, {
        contentType: "text/plain",
      }),
    );
  });

  test("deny files larger than 5 MB", async () => {
    const storage = testEnvironment.authenticatedContext(ownerUid).storage();
    const oversizedFile = new Uint8Array(5 * 1024 * 1024 + 1);

    await assertFails(
      uploadBytes(ref(storage, validObjectPath), oversizedFile, {
        contentType: "application/pdf",
      }),
    );
  });

  test("deny empty files", async () => {
    const storage = testEnvironment.authenticatedContext(ownerUid).storage();

    await assertFails(
      uploadBytes(ref(storage, validObjectPath), new Uint8Array(0), {
        contentType: "application/pdf",
      }),
    );
  });

  test("deny objects outside the expected path or with an unsafe name", async () => {
    const storage = testEnvironment.authenticatedContext(ownerUid).storage();
    const invalidPath = `users/${ownerUid}/avatar.png`;
    const unsafeNamePath =
      `users/${ownerUid}/transactions/${transactionId}/receipt.pdf`;

    await assertFails(
      uploadBytes(ref(storage, invalidPath), validPdf, {
        contentType: "application/pdf",
      }),
    );
    await assertFails(
      uploadBytes(ref(storage, unsafeNamePath), validPdf, {
        contentType: "application/pdf",
      }),
    );
  });
});
