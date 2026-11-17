"use client";

import { VisuallyHidden } from "@banking/shared/ui/styles/shared";
import { useValuesVisibility } from "@dashboard/contexts/ValuesVisibilityContext";
import { useLanguage } from "@dashboard/contexts/LanguageContext";

import type { SensitiveValueProps } from "./interface";

export const MASKED_VALUE = "R$ ••••••";

/**
 * Exibe um valor monetário ou, com "ocultar valores" ativo, uma máscara. O
 * leitor de tela ouve "Valor oculto" em vez dos marcadores.
 */
export function SensitiveValue({ children }: SensitiveValueProps) {
  const { hidden } = useValuesVisibility();
  const { t } = useLanguage();

  if (!hidden) return <>{children}</>;

  return (
    <span>
      <span aria-hidden="true">{MASKED_VALUE}</span>
      <VisuallyHidden>{t("dash.valueHidden")}</VisuallyHidden>
    </span>
  );
}
