import {
  Observable,
  defer,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  shareReplay,
  startWith,
} from "rxjs";

/** Lê o estado atual de conectividade (assume online fora do navegador). */
export function readOnlineStatus(nav?: Navigator): boolean {
  const navigatorRef =
    nav ?? (typeof navigator === "undefined" ? undefined : navigator);
  return navigatorRef?.onLine ?? true;
}

/** Stream `true`/`false` a partir dos eventos `online`/`offline`. */
export function createOnlineStream(
  win?: Window,
  nav?: Navigator,
): Observable<boolean> {
  return defer(() => {
    const target = win ?? window;

    return merge(
      fromEvent(target, "online").pipe(map(() => true)),
      fromEvent(target, "offline").pipe(map(() => false)),
    ).pipe(startWith(readOnlineStatus(nav)), distinctUntilChanged());
  });
}

/** Conectividade global com o último valor reaproveitado pelos assinantes. */
export const online$ = createOnlineStream().pipe(
  shareReplay({ bufferSize: 1, refCount: true }),
);
