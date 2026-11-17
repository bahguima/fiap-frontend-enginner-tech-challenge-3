import { QueryState } from "@banking/shared/ui/components/QueryState";
import type { PageFallbackProps } from "./interface";
import { FallbackRoot, SkeletonBlock, SkeletonGrid } from "./styled";

/**
 * Fallback de `Suspense` das páginas do dashboard.
 *
 * O texto vem do `QueryState` (região `role="status"`, anunciada por leitores
 * de tela); os blocos de skeleton são apenas decorativos (`aria-hidden`).
 */
export function PageFallback({
  message = "Carregando página...",
  "data-testid": dataTestId,
}: PageFallbackProps) {
  return (
    <FallbackRoot data-testid={dataTestId} aria-busy="true">
      <QueryState kind="loading" message={message} />
      <SkeletonGrid aria-hidden="true">
        <SkeletonBlock $height="6rem" />
        <SkeletonBlock $height="6rem" />
        <SkeletonBlock $height="6rem" />
      </SkeletonGrid>
      <SkeletonBlock aria-hidden="true" $height="14rem" />
    </FallbackRoot>
  );
}
