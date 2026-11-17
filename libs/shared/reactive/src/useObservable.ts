import { useEffect, useRef, useState } from "react";

import type { ReactiveObserver, ReactiveSource } from "./types";

/**
 * Assina `source` enquanto o componente estiver montado e repassa os eventos
 * ao `observer` mais recente (sem reassinar quando os callbacks mudam).
 * `source` deve ser estável (memoizado ou de módulo).
 */
export function useObservable<T>(
  source: ReactiveSource<T> | null | undefined,
  observer: ReactiveObserver<T>,
): void {
  const observerRef = useRef(observer);
  observerRef.current = observer;

  useEffect(() => {
    if (!source) return undefined;

    const subscription = source.subscribe({
      next: (value) => observerRef.current.next?.(value),
      error: (error) => observerRef.current.error?.(error),
      complete: () => observerRef.current.complete?.(),
    });

    return () => subscription.unsubscribe();
  }, [source]);
}

/** Expõe o último valor emitido por `source` como estado React. */
export function useObservableState<T>(
  source: ReactiveSource<T> | null | undefined,
  initialValue: T | (() => T),
): T {
  const [value, setValue] = useState<T>(initialValue);

  useObservable(source, { next: (nextValue) => setValue(() => nextValue) });

  return value;
}
