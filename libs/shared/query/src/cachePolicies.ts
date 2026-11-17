const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** Domínios de dado de servidor com política de cache própria. */
export type CacheDomain =
  | "categories"
  | "dashboard"
  | "transactions"
  | "session";

/** Metadado gravado em cada query para identificar seu domínio de cache. */
export interface CacheDomainMeta extends Record<string, unknown> {
  cacheDomain: CacheDomain;
}

export interface CachePolicy {
  /** Tempo em que o dado é considerado fresco (não é refeito). */
  staleTime: number;
  /** Tempo que o dado inativo permanece em memória antes da coleta. */
  gcTime: number;
  /** Identifica o domínio para filtros de persistência e diagnóstico. */
  meta: CacheDomainMeta;
}

/**
 * Política de cache por domínio, proporcional à volatilidade do dado.
 *
 * - `categories`: catálogo quase estático; fresco por 30 min e mantido por
 *   24 h (mesma janela do `maxAge` da persistência, para não ser coletado
 *   antes de ser restaurado entre recargas).
 * - `dashboard`: agregados derivados das transações; fresco por 1 min. As
 *   mutações de transação invalidam explicitamente estes agregados.
 * - `transactions`: listas e anexos mudam com frequência e por mais de uma
 *   aba/dispositivo; fresco por 15 s.
 * - `session`: espelha o cookie de sessão. Fica fresco por 5 min e é
 *   reescrito diretamente por login/logout (`setQueryData`); só é refeito em
 *   montagem quando estiver velho. Nunca é persistido.
 */
export const cachePolicies = {
  categories: {
    staleTime: 30 * MINUTE,
    gcTime: 24 * HOUR,
    meta: { cacheDomain: "categories" },
  },
  dashboard: {
    staleTime: 1 * MINUTE,
    gcTime: 10 * MINUTE,
    meta: { cacheDomain: "dashboard" },
  },
  transactions: {
    staleTime: 15 * SECOND,
    gcTime: 5 * MINUTE,
    meta: { cacheDomain: "transactions" },
  },
  session: {
    staleTime: 5 * MINUTE,
    gcTime: 30 * MINUTE,
    meta: { cacheDomain: "session" },
  },
} as const satisfies Record<CacheDomain, CachePolicy>;

export function getCacheDomain(meta: unknown): CacheDomain | null {
  if (typeof meta !== "object" || meta === null) return null;
  const domain = (meta as Partial<CacheDomainMeta>).cacheDomain;
  return typeof domain === "string" && domain in cachePolicies
    ? (domain as CacheDomain)
    : null;
}
