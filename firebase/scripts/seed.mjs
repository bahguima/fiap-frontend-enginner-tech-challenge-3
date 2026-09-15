import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const projectId = "demo-bytebank";
const host = process.env.FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
const email = "demo@bytebank.test";
const password = "ByteBank123!";

if (!projectId.startsWith("demo-")) {
  throw new Error("Refusing to seed a non-demo Firebase project.");
}

const app = initializeApp({
  apiKey: "demo-bytebank-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: `${projectId}.appspot.com`,
  appId: "1:000000000000:web:demo-bytebank-seed",
});
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

async function seedCategory({ id, name, type }) {
  const response = await fetch(
    `http://${host}:8080/v1/projects/${projectId}/databases/(default)/documents/transactionCategories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          name: { stringValue: name },
          type: { stringValue: type },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to seed category ${id}: ${response.status} ${await response.text()}`,
    );
  }
}

connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
connectFirestoreEmulator(firestore, host, 8080);
connectStorageEmulator(storage, host, 9199);

try {
  let credential;

  try {
    credential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "auth/email-already-in-use"
    ) {
      throw error;
    }

    credential = await signInWithEmailAndPassword(auth, email, password);
  }

  const uid = credential.user.uid;
  const salaryId = "seed-salary-2026-09";
  const marketId = "seed-market-2026-09";
  const attachmentId = "seed-receipt-market";
  const storagePath =
    `users/${uid}/transactions/${marketId}/` +
    `${attachmentId}-comprovante.pdf`;
  const createdAt = Timestamp.fromDate(new Date("2026-09-01T12:00:00.000Z"));
  const pdfBytes = new TextEncoder().encode(
    "%PDF-1.4\n% ByteBank emulator seed\n%%EOF\n",
  );
  const categories = [
    { id: "groceries", name: "Alimentação", type: "expense" },
    { id: "housing", name: "Moradia", type: "expense" },
    { id: "transport", name: "Transporte", type: "expense" },
    { id: "salary", name: "Salário", type: "income" },
    { id: "investment", name: "Investimentos", type: "both" },
    { id: "other", name: "Outros", type: "both" },
  ];

  await Promise.all([
    ...categories.map(seedCategory),
    setDoc(doc(firestore, "users", uid), {
      uid,
      displayName: "Cliente ByteBank",
      email,
      createdAt,
      updatedAt: createdAt,
    }),
    setDoc(doc(firestore, "users", uid, "transactions", salaryId), {
      description: "Salario",
      descriptionNormalized: "salario",
      observation: "",
      amountInCents: 750000,
      incomeAmountInCents: 750000,
      expenseAmountInCents: 0,
      type: "income",
      categoryId: "salary",
      categoryName: "Salário",
      occurredOn: "2026-09-05",
      status: "completed",
      attachmentCount: 0,
      createdAt,
      updatedAt: createdAt,
      schemaVersion: 1,
    }),
    setDoc(doc(firestore, "users", uid, "transactions", marketId), {
      description: "Supermercado",
      descriptionNormalized: "supermercado",
      observation: "Compra mensal",
      amountInCents: 28590,
      incomeAmountInCents: 0,
      expenseAmountInCents: 28590,
      type: "expense",
      categoryId: "groceries",
      categoryName: "Alimentação",
      occurredOn: "2026-09-08",
      status: "completed",
      attachmentCount: 1,
      createdAt,
      updatedAt: createdAt,
      schemaVersion: 1,
    }),
  ]);

  await uploadBytes(
    ref(storage, storagePath),
    pdfBytes,
    { contentType: "application/pdf" },
  );

  await setDoc(
    doc(
      firestore,
      "users",
      uid,
      "transactions",
      marketId,
      "attachments",
      attachmentId,
    ),
    {
      fileName: "comprovante.pdf",
      contentType: "application/pdf",
      sizeInBytes: pdfBytes.byteLength,
      storagePath,
      status: "ready",
      createdAt,
      updatedAt: createdAt,
    },
  );

  console.info(`Seeded ${projectId} with ${email} (uid: ${uid}).`);
} finally {
  await deleteApp(app);
}
