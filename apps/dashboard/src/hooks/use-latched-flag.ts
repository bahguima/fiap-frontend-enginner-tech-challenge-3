import { useState } from "react";

/**
 * Retorna `true` a partir da primeira vez em que `value` for `true` e não
 * volta mais a `false`. Estado estritamente visual: usado para montar um
 * modal lazy somente após a primeira abertura e mantê-lo montado depois,
 * preservando a animação de fechamento do Radix.
 */
export function useLatchedFlag(value: boolean): boolean {
  const [latched, setLatched] = useState(value);

  if (value && !latched) {
    setLatched(true);
  }

  return latched || value;
}
