import type { Query, QueryClient } from "@tanstack/react-query";
import {
  persistQueryClient,
  type PersistedClient,
  type Persister,
} from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { cachePolicies, getCacheDomain, type CacheDomain } from "./cachePolicies";

/**
 * Domínios cujo cache pode sobreviver a recargas. Somente dados públicos e
 * não sensíveis entram aqui: sessão, perfil, saldos e transações ficam
 * exclusivamente em memória.
 */
export const PERSISTED_CACHE_DOMAINS: readonly CacheDomain[] = ["categories"];

/**
 * Domínios permitidos quando o storage é criptografado por sessão
 * (AES-GCM, chave não extraível descartada no logout): além do catálogo,
 * o resumo do dashboard (saldos agregados). Sessão e transações continuam
 * somente em memória.
 */
export const ENCRYPTED_PERSISTED_CACHE_DOMAINS: readonly CacheDomain[] = [
  "categories",
  "dashboard",
];

/** Troque ao mudar o formato dos dados persistidos para descartar o cache. */
export const QUERY_CACHE_BUSTER = "bytebank-query-cache-v1";
export const QUERY_CACHE_STORAGE_KEY = "bytebank:query-cache";
/** Idade máxima do cache persistido (igual ao `gcTime` de categorias). */
export const QUERY_CACHE_MAX_AGE = cachePolicies.categories.gcTime;

/** Contrato mínimo de um storage síncrono (ex.: `window.localStorage`). */
export interface SyncCacheStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/** Contrato de um storage assíncrono (ex.: storage criptografado). */
export interface AsyncCacheStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface AsyncStoragePersisterOptions {
  storage: AsyncCacheStorage;
  key?: string;
  /** Intervalo mínimo entre gravações (ms). */
  throttleTime?: number;
}

/**
 * Persister assíncrono com throttle (a gravação mais recente vence). Erros
 * de storage/criptografia não derrubam a aplicação: o cache só deixa de ser
 * persistido. `removeClient` cancela gravações pendentes.
 */
export function createAsyncStoragePersister({
  storage,
  key = QUERY_CACHE_STORAGE_KEY,
  throttleTime = 1000,
}: AsyncStoragePersisterOptions): Persister {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    timer = null;
    const client = pending;
    pending = null;
    if (!client) return;

    try {
      await storage.setItem(key, JSON.stringify(client));
    } catch {
      // Storage indisponível/cheio ou chave descartada: segue sem persistir.
    }
  };

  return {
    persistClient: (client) => {
      pending = client;
      if (timer === null) timer = setTimeout(() => void flush(), throttleTime);
    },
    restoreClient: async () => {
      try {
        const raw = await storage.getItem(key);
        return raw ? (JSON.parse(raw) as PersistedClient) : undefined;
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      pending = null;
      await storage.removeItem(key);
    },
  };
}

export interface QueryPersistenceOptions {
  /**
   * Storage síncrono injetado pelo composition root (o app), para que esta
   * lib não acesse APIs de plataforma diretamente.
   */
  storage?: SyncCacheStorage | null;
  /**
   * Ponto de extensão: um `Persister` completo substitui o storage síncrono.
   * A fase de segurança deve fornecer aqui um persister criptografado
   * (Web Crypto/`crypto.subtle`, possivelmente assíncrono) sem alterar a
   * allowlist nem os consumidores.
   */
  persister?: Persister;
  /** Domínios permitidos; por padrão {@link PERSISTED_CACHE_DOMAINS}. */
  allowlist?: readonly CacheDomain[];
  key?: string;
  buster?: string;
  maxAge?: number;
  /** Intervalo mínimo entre gravações no storage (ms). */
  throttleTime?: number;
}

export function isPersistableQuery(
  query: Pick<Query, "meta" | "state">,
  allowlist: readonly CacheDomain[] = PERSISTED_CACHE_DOMAINS,
) {
  const domain = getCacheDomain(query.meta);
  return (
    domain !== null &&
    allowlist.includes(domain) &&
    query.state.status === "success"
  );
}

/**
 * Restaura e passa a persistir o cache das queries da allowlist.
 *
 * @returns função que interrompe a persistência e promessa da restauração.
 */
export function enableQueryPersistence(
  queryClient: QueryClient,
  options: QueryPersistenceOptions = {},
): [unsubscribe: () => void, restored: Promise<void>] {
  const {
    storage,
    key = QUERY_CACHE_STORAGE_KEY,
    allowlist = PERSISTED_CACHE_DOMAINS,
    buster = QUERY_CACHE_BUSTER,
    maxAge = QUERY_CACHE_MAX_AGE,
    throttleTime = 1000,
  } = options;
  const persister =
    options.persister ??
    // A Fase 4 usa o persister síncrono (localStorage); a versão assíncrona
    // entra junto do storage criptografado via `options.persister`.
    createSyncStoragePersister({ storage, key, throttleTime });

  return persistQueryClient({
    queryClient,
    persister,
    buster,
    maxAge,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => isPersistableQuery(query, allowlist),
      shouldDehydrateMutation: () => false,
    },
  });
}
