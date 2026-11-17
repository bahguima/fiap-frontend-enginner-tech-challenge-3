import type { QueryClient } from "@tanstack/react-query";
import { authApi } from "@banking/shared/api-client";
import {
  createAsyncStoragePersister,
  enableQueryPersistence,
  ENCRYPTED_PERSISTED_CACHE_DOMAINS,
  QUERY_CACHE_STORAGE_KEY,
  type SyncCacheStorage,
} from "@banking/shared/query";
import {
  createEncryptedStorage,
  createSessionKeyring,
  isWebCryptoAvailable,
} from "@banking/shared/security";

export interface EncryptedQueryPersistenceOptions {
  storage: SyncCacheStorage | null;
  key?: string;
  throttleTime?: number;
  /** Chamado quando a restauração da sessão termina e a persistência está ativa. */
  onRestored?: () => void;
}

/**
 * Composition root da persistência criptografada do cache.
 *
 * - `established` (login ou sessão restaurada pelo refresh): deriva a chave
 *   AES-GCM não extraível a partir do `sessionKey`, restaura o cache
 *   (decifrando) e passa a persistir somente os domínios permitidos
 *   (categorias e resumo do dashboard).
 * - `ended` (logout, inatividade, refresh rejeitado): para de persistir,
 *   descarta a chave e apaga o blob cifrado.
 *
 * Sem storage ou sem Web Crypto, nada é persistido.
 *
 * @returns função que desfaz a ligação.
 */
export function bindEncryptedQueryPersistence(
  queryClient: QueryClient,
  {
    storage,
    key = QUERY_CACHE_STORAGE_KEY,
    throttleTime,
    onRestored,
  }: EncryptedQueryPersistenceOptions,
): () => void {
  if (!storage || !isWebCryptoAvailable()) return () => undefined;

  const keyring = createSessionKeyring();
  const persister = createAsyncStoragePersister({
    storage: createEncryptedStorage({ storage, getKey: keyring.getKey }),
    key,
    throttleTime,
  });
  let stopPersisting: (() => void) | null = null;

  const stop = () => {
    stopPersisting?.();
    stopPersisting = null;
  };

  const unsubscribe = authApi.subscribe((event) => {
    if (event.type === "established") {
      void keyring
        .activate(event.sessionKey)
        .then(() => {
          // A sessão pode ter terminado durante a derivação.
          if (keyring.getKey() === null) return;
          stop();
          const [unsubscribe, restored] = enableQueryPersistence(queryClient, {
            persister,
            allowlist: ENCRYPTED_PERSISTED_CACHE_DOMAINS,
          });
          stopPersisting = unsubscribe;
          return restored.then(() => onRestored?.());
        })
        .catch(() => undefined);
    }

    if (event.type === "ended") {
      stop();
      keyring.destroy();
      void persister.removeClient();
    }
  });

  return () => {
    unsubscribe();
    stop();
    keyring.destroy();
  };
}
