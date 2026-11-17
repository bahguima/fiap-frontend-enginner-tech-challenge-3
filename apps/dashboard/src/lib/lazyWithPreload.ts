import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

export interface PreloadableModule<TProps extends object> {
  default: ComponentType<TProps>;
}

export type PreloadableComponent<TProps extends object> = LazyExoticComponent<
  ComponentType<TProps>
> & {
  /** Baixa o chunk antecipadamente (ex.: hover/foco) sem renderizar. */
  preload: () => Promise<PreloadableModule<TProps>>;
};

/**
 * `React.lazy` com um `preload()` que reaproveita a mesma promessa.
 *
 * O `import()` dinâmico só é disparado uma vez: o prefetch em intenção do
 * usuário e a renderização sob `Suspense` compartilham o mesmo chunk. Em caso
 * de falha (ex.: rede), a promessa é descartada para permitir nova tentativa.
 */
export function lazyWithPreload<TProps extends object>(
  factory: () => Promise<PreloadableModule<TProps>>,
): PreloadableComponent<TProps> {
  let pending: Promise<PreloadableModule<TProps>> | undefined;

  const load = () => {
    pending ??= factory().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });

    return pending;
  };

  return Object.assign(lazy(load), { preload: load });
}
