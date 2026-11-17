"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@banking/shared/reactive";
import { useLanguage } from "@dashboard/contexts/LanguageContext";

import { Banner } from "./styled";

/**
 * Aviso visual de conexão perdida, alimentado pelo stream `online$`.
 * A região viva fica sempre montada para que leitores de tela anunciem a
 * mudança quando a mensagem aparece.
 */
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  return (
    <div aria-live="polite" role="status">
      {!isOnline && (
        <Banner data-testid="offline-banner">
          <WifiOff aria-hidden="true" />
          <span>{t("dash.offline")}</span>
        </Banner>
      )}
    </div>
  );
};
