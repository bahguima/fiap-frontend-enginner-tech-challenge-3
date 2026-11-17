import type { ReactNode } from "react";

export interface SensitiveValueProps {
  /** Valor já formatado pela API (ex.: "R$ 12.740,57"). */
  children: ReactNode;
}
