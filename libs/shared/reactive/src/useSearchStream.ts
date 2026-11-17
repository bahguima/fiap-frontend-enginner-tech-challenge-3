import { useCallback, useEffect, useRef } from "react";

import { createSearchStream, type SearchStream } from "./searchStream";

export interface UseSearchStreamOptions<TInput, TOutput> {
  debounceMs: number;
  execute: (input: TInput, signal: AbortSignal) => TOutput | Promise<TOutput>;
  isEqual?: (previous: TInput, current: TInput) => boolean;
  /** Recebe cada valor estabilizado/resultado não cancelado. */
  onResult: (output: TOutput) => void;
  onError?: (error: unknown, input: TInput) => void;
}

/**
 * Liga um `createSearchStream` ao ciclo de vida do componente e devolve uma
 * função estável `push` para alimentar o stream. Callbacks podem mudar a cada
 * render sem recriar o stream; `debounceMs` recria (raramente muda).
 */
export function useSearchStream<TInput, TOutput>(
  options: UseSearchStreamOptions<TInput, TOutput>,
): (input: TInput) => void {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const streamRef = useRef<SearchStream<TInput, TOutput> | null>(null);
  const { debounceMs } = options;

  useEffect(() => {
    const stream = createSearchStream<TInput, TOutput>({
      debounceMs,
      execute: (input, signal) => optionsRef.current.execute(input, signal),
      isEqual: (previous, current) =>
        (optionsRef.current.isEqual ?? Object.is)(previous, current),
      onError: (error, input) => optionsRef.current.onError?.(error, input),
    });
    const subscription = stream.subscribe({
      next: (output) => optionsRef.current.onResult(output),
    });
    streamRef.current = stream;

    return () => {
      subscription.unsubscribe();
      stream.dispose();
      streamRef.current = null;
    };
  }, [debounceMs]);

  return useCallback((input: TInput) => streamRef.current?.next(input), []);
}
