"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface ValuesVisibilityContextValue {
  /** `true` quando os valores monetários estão mascarados na tela. */
  hidden: boolean;
  toggle: () => void;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextValue>({
  hidden: false,
  toggle: () => {},
});

/**
 * Estado estritamente visual ("ocultar valores"): mascara a exibição dos
 * valores, sem alterar o cache nem as respostas da API.
 */
export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(
    () => ({ hidden, toggle: () => setHidden((current) => !current) }),
    [hidden],
  );

  return (
    <ValuesVisibilityContext.Provider value={value}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
}

export const useValuesVisibility = () => useContext(ValuesVisibilityContext);
