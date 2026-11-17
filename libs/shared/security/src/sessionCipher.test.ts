import {
  createEncryptedStorage,
  createSessionKeyring,
  decryptString,
  deriveSessionKey,
  encryptString,
  type StringStorage,
} from "./index";

const SESSION_MATERIAL = "q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c";
const OTHER_MATERIAL = "Zx9Yw8Vu7Ts6Rq5Po4Nm3Lk2Ji1Hg0Fe9Dc8Ba7Zy6X";

function createMemoryStorage(): StringStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("criptografia de sessão (Web Crypto, AES-GCM)", () => {
  it("faz a ida e volta encrypt/decrypt sem expor o texto claro", async () => {
    const key = await deriveSessionKey(SESSION_MATERIAL);
    const plaintext = JSON.stringify({ balance: "R$ 12.740,57" });

    const payload = await encryptString(key, plaintext, "bytebank:query-cache");

    expect(payload.v).toBe(1);
    expect(JSON.stringify(payload)).not.toContain("12.740");
    await expect(decryptString(key, payload, "bytebank:query-cache")).resolves.toBe(
      plaintext,
    );
  });

  it("usa IV aleatório por mensagem", async () => {
    const key = await deriveSessionKey(SESSION_MATERIAL);
    const first = await encryptString(key, "mesmo conteúdo");
    const second = await encryptString(key, "mesmo conteúdo");

    expect(first.iv).not.toBe(second.iv);
    expect(first.ct).not.toBe(second.ct);
  });

  it("deriva uma chave AES-GCM não extraível e determinística por sessão", async () => {
    const key = await deriveSessionKey(SESSION_MATERIAL);
    const sameSession = await deriveSessionKey(SESSION_MATERIAL);

    expect(key.extractable).toBe(false);
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(key.usages.sort()).toEqual(["decrypt", "encrypt"]);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();

    const payload = await encryptString(key, "restaurável após recarregar");
    await expect(decryptString(sameSession, payload)).resolves.toBe(
      "restaurável após recarregar",
    );
  });

  it("rejeita chave de outra sessão, AAD diferente e conteúdo adulterado", async () => {
    const key = await deriveSessionKey(SESSION_MATERIAL);
    const otherKey = await deriveSessionKey(OTHER_MATERIAL);
    const payload = await encryptString(key, "segredo", "item-a");
    const tampered = {
      ...payload,
      ct: `${payload.ct.slice(0, -2)}${payload.ct.endsWith("AA") ? "BB" : "AA"}`,
    };

    await expect(decryptString(otherKey, payload, "item-a")).rejects.toThrow();
    await expect(decryptString(key, payload, "item-b")).rejects.toThrow();
    await expect(decryptString(key, tampered, "item-a")).rejects.toThrow();
  });

  it("recusa material de chave curto demais ou inválido", async () => {
    await expect(deriveSessionKey("c2hvcnQ")).rejects.toThrow("insuficiente");
    await expect(deriveSessionKey("não é base64!")).rejects.toThrow("inválido");
  });
});

describe("storage criptografado", () => {
  it("grava somente o payload cifrado e o lê de volta", async () => {
    const storage = createMemoryStorage();
    const keyring = createSessionKeyring();
    await keyring.activate(SESSION_MATERIAL);
    const encrypted = createEncryptedStorage({ storage, getKey: keyring.getKey });

    await encrypted.setItem("cache", '{"saldo":"R$ 1.500,00"}');

    const raw = storage.data.get("cache") ?? "";
    expect(raw).not.toContain("1.500");
    expect(JSON.parse(raw)).toMatchObject({ v: 1, iv: expect.any(String), ct: expect.any(String) });
    await expect(encrypted.getItem("cache")).resolves.toBe('{"saldo":"R$ 1.500,00"}');
  });

  it("descarta a chave no logout: nada é lido nem gravado", async () => {
    const storage = createMemoryStorage();
    const keyring = createSessionKeyring();
    await keyring.activate(SESSION_MATERIAL);
    const encrypted = createEncryptedStorage({ storage, getKey: keyring.getKey });
    await encrypted.setItem("cache", "dados");

    keyring.destroy();

    expect(keyring.getKey()).toBeNull();
    await expect(encrypted.getItem("cache")).resolves.toBeNull();
    await encrypted.setItem("cache-2", "dados");
    expect(storage.data.has("cache-2")).toBe(false);
  });

  it("remove itens que não decifram com a chave da sessão atual", async () => {
    const storage = createMemoryStorage();
    const keyring = createSessionKeyring();
    await keyring.activate(SESSION_MATERIAL);
    await createEncryptedStorage({ storage, getKey: keyring.getKey }).setItem(
      "cache",
      "da sessão anterior",
    );
    storage.data.set("legado", '{"clientState":"em claro"}');

    await keyring.activate(OTHER_MATERIAL);
    const encrypted = createEncryptedStorage({ storage, getKey: keyring.getKey });

    await expect(encrypted.getItem("cache")).resolves.toBeNull();
    await expect(encrypted.getItem("legado")).resolves.toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("ignora uma ativação antiga que termina depois do logout", async () => {
    const keyring = createSessionKeyring();
    const pending = keyring.activate(SESSION_MATERIAL);
    keyring.destroy();
    await pending;

    expect(keyring.getKey()).toBeNull();
  });
});
