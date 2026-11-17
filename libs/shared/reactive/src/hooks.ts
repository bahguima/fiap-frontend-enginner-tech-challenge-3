import { useCallback, useMemo } from "react";
import { merge, Subject } from "rxjs";

import { activity$, idle } from "./activity";
import { online$, readOnlineStatus } from "./online";
import { useObservableState } from "./useObservable";

/** `true` enquanto o navegador reportar conexão de rede. */
export function useOnlineStatus(): boolean {
  return useObservableState(online$, () => readOnlineStatus());
}

/**
 * `true` após `ms` sem atividade do usuário (mouse, teclado, toque ou retorno
 * à aba). Pensado para o logout por inatividade da camada de segurança.
 */
export function useIdle(ms: number): boolean {
  return useIdleTimer(ms).idle;
}

export interface IdleTimer {
  /** `true` após `ms` sem atividade. */
  idle: boolean;
  /**
   * Reinicia a contagem como se houvesse atividade. Necessário quando a
   * confirmação vem de um clique sem `mousedown`/`keydown` (ex.: ativação
   * por leitor de tela), que não passa pelo stream de atividade.
   */
  reset: () => void;
}

/** Como {@link useIdle}, com reinício explícito do temporizador. */
export function useIdleTimer(ms: number): IdleTimer {
  const resets = useMemo(() => new Subject<number>(), []);
  const idle$ = useMemo(
    () => merge(activity$, resets).pipe(idle(ms)),
    [ms, resets],
  );
  const isIdle = useObservableState<boolean>(idle$, false);
  const reset = useCallback(() => resets.next(Date.now()), [resets]);

  return { idle: isIdle, reset };
}
