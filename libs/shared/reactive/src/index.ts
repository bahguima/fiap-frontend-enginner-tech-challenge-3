/**
 * Programação reativa do ByteBank. Único ponto do workspace autorizado a
 * importar `rxjs`; a API pública expõe apenas hooks e tipos próprios.
 */
import { activity$ as activityStream } from "./activity";
import { online$ as onlineStream } from "./online";
import type { ReactiveSource } from "./types";

export type {
  ReactiveObserver,
  ReactiveSource,
  ReactiveSubscription,
} from "./types";
export { useObservable, useObservableState } from "./useObservable";
export {
  createSearchStream,
  type SearchStream,
  type SearchStreamOptions,
} from "./searchStream";
export {
  useSearchStream,
  type UseSearchStreamOptions,
} from "./useSearchStream";
export { useIdle, useIdleTimer, useOnlineStatus } from "./hooks";
export type { IdleTimer } from "./hooks";

/** Atividade do usuário (timestamp de cada evento, com throttle). */
export const activity$: ReactiveSource<number> = activityStream;
/** Conectividade do navegador (`true` online, `false` offline). */
export const online$: ReactiveSource<boolean> = onlineStream;
