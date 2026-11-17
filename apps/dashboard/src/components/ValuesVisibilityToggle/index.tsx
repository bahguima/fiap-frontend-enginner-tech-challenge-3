"use client";

import { Eye, EyeOff } from "lucide-react";
import { useValuesVisibility } from "@dashboard/contexts/ValuesVisibilityContext";
import { useLanguage } from "@dashboard/contexts/LanguageContext";
import { MutedButton } from "@dashboard/components/ThemeToggle/styled";

/** Botão de alternância (aria-pressed) com rótulo estável. */
export function ValuesVisibilityToggle() {
  const { hidden, toggle } = useValuesVisibility();
  const { t } = useLanguage();

  return (
    <MutedButton
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={t("dash.hideValues")}
      title={t("dash.hideValues")}
    >
      {hidden ? (
        <EyeOff size={16} aria-hidden="true" />
      ) : (
        <Eye size={16} aria-hidden="true" />
      )}
    </MutedButton>
  );
}
