import {
  decryptString,
  deriveSessionKey,
  encryptString,
  isEncryptedPayload,
} from "./sessionCipher";

/** Storage síncrono de strings (ex.: `window.localStorage`). */
export interface StringStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/** Storage assíncrono de strings, consumido pelo persister do TanStack Query. */
export interface AsyncStringStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Guarda a chave da sessão corrente em memória. `activate` deriva a chave a
 * partir do material da sessão; `destroy` a descarta (logout). Uma ativação
 * mais antiga que termine depois de `destroy`/nova ativação é ignorada.
 */
export interface SessionKeyring {
  activate: (material: string) => Promise<void>;
  destroy: () => void;
  getKey: () => CryptoKey | null;
}

export function createSessionKeyring(): SessionKeyring {
  let key: CryptoKey | null = null;
  let generation = 0;

  return {
    activate: async (material) => {
      generation += 1;
      const current = generation;
      const derived = await deriveSessionKey(material);
      if (current === generation) key = derived;
    },
    destroy: () => {
      generation += 1;
      key = null;
    },
    getKey: () => key,
  };
}

export interface EncryptedStorageOptions {
  storage: StringStorage;
  getKey: () => CryptoKey | null;
}

/**
 * Storage criptografado: grava `{ v, iv, ct }` (AES-GCM) usando o nome do
 * item como AAD. Sem chave (sessão encerrada), não lê nem grava nada. Itens
 * que não decifram (outra sessão, adulteração, formato antigo) são removidos.
 */
export function createEncryptedStorage({
  storage,
  getKey,
}: EncryptedStorageOptions): AsyncStringStorage {
  return {
    getItem: async (name) => {
      const key = getKey();
      const raw = storage.getItem(name);
      if (!key || raw === null) return null;

      try {
        const payload: unknown = JSON.parse(raw);
        if (!isEncryptedPayload(payload)) throw new Error("payload inválido");
        return await decryptString(key, payload, name);
      } catch {
        storage.removeItem(name);
        return null;
      }
    },
    setItem: async (name, value) => {
      const key = getKey();
      if (!key) return;

      const payload = await encryptString(key, value, name);
      // A sessão pode ter terminado durante a cifragem.
      if (getKey() !== key) return;
      storage.setItem(name, JSON.stringify(payload));
    },
    removeItem: async (name) => {
      storage.removeItem(name);
    },
  };
}
