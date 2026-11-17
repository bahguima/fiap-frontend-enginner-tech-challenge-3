/**
 * Criptografia simétrica de dados sensíveis no cliente, exclusivamente com a
 * Web Crypto API (`crypto.subtle`): AES-GCM de 256 bits, IV aleatório de 96
 * bits por mensagem e dados associados (AAD) opcionais que amarram o texto
 * cifrado ao seu contexto (ex.: a chave do storage).
 *
 * A chave é derivada por HKDF-SHA-256 a partir do material da sessão
 * (`sessionKey`, entregue pela API e vinculado à sessão do servidor) e criada
 * como **não extraível**: nem o próprio código consegue exportá-la. Ela vive
 * só em memória e é descartada no logout.
 */

const KEY_INFO = "bytebank:query-cache:aes-gcm:v1";
const KEY_SALT = "bytebank:session-key:v1";
const IV_BYTE_LENGTH = 12;
const PAYLOAD_VERSION = 1;

export interface EncryptedPayload {
  v: typeof PAYLOAD_VERSION;
  /** IV (base64url). */
  iv: string;
  /** Texto cifrado + tag de autenticação GCM (base64url). */
  ct: string;
}

export interface DeriveSessionKeyOptions {
  salt?: string;
  info?: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function isWebCryptoAvailable() {
  return typeof globalThis.crypto?.subtle?.importKey === "function";
}

function getSubtle(): SubtleCrypto {
  if (!isWebCryptoAvailable()) {
    throw new Error("Web Crypto API indisponível neste ambiente.");
  }
  return globalThis.crypto.subtle;
}

/** Deriva a chave AES-GCM não extraível da sessão. */
export async function deriveSessionKey(
  material: string,
  { salt = KEY_SALT, info = KEY_INFO }: DeriveSessionKeyOptions = {},
): Promise<CryptoKey> {
  const subtle = getSubtle();
  let rawMaterial: Uint8Array<ArrayBuffer>;
  try {
    rawMaterial = base64UrlToBytes(material);
  } catch {
    throw new Error("Material de chave inválido.");
  }

  if (rawMaterial.byteLength < 16) {
    throw new Error("Material de chave insuficiente.");
  }

  try {
    const baseKey = await subtle.importKey("raw", rawMaterial, "HKDF", false, [
      "deriveKey",
    ]);

    return await subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: textEncoder.encode(salt),
        info: textEncoder.encode(info),
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  } finally {
    // Descarta a cópia do material assim que a chave é derivada.
    rawMaterial.fill(0);
  }
}

export async function encryptString(
  key: CryptoKey,
  plaintext: string,
  associatedData?: string,
): Promise<EncryptedPayload> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const ciphertext = await getSubtle().encrypt(
    gcmParams(iv, associatedData),
    key,
    textEncoder.encode(plaintext),
  );

  return {
    v: PAYLOAD_VERSION,
    iv: bytesToBase64Url(iv),
    ct: bytesToBase64Url(new Uint8Array(ciphertext)),
  };
}

/** Falha (rejeita) se a chave, o AAD ou o conteúdo não conferirem. */
export async function decryptString(
  key: CryptoKey,
  payload: EncryptedPayload,
  associatedData?: string,
): Promise<string> {
  if (payload.v !== PAYLOAD_VERSION) {
    throw new Error("Versão de payload criptografado não suportada.");
  }

  const plaintext = await getSubtle().decrypt(
    gcmParams(base64UrlToBytes(payload.iv), associatedData),
    key,
    base64UrlToBytes(payload.ct),
  );

  return textDecoder.decode(plaintext);
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<EncryptedPayload>;
  return (
    candidate.v === PAYLOAD_VERSION &&
    typeof candidate.iv === "string" &&
    typeof candidate.ct === "string"
  );
}

function gcmParams(iv: BufferSource, associatedData?: string): AesGcmParams {
  return associatedData === undefined
    ? { name: "AES-GCM", iv }
    : { name: "AES-GCM", iv, additionalData: textEncoder.encode(associatedData) };
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
