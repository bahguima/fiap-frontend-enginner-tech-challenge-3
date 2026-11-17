import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from "rxjs";

import type { ReactiveObserver, ReactiveSubscription } from "./types";

export interface SearchStreamOptions<TInput, TOutput> {
  /** Janela de estabilização (ms) antes de executar. */
  debounceMs: number;
  /**
   * Executa a busca para o valor estabilizado. Quando um novo valor chega, o
   * `signal` da execução anterior é abortado e seu resultado é descartado.
   */
  execute: (input: TInput, signal: AbortSignal) => TOutput | Promise<TOutput>;
  /** Igualdade usada por `distinctUntilChanged` (padrão: `Object.is`). */
  isEqual?: (previous: TInput, current: TInput) => boolean;
  /** Recebe falhas de uma execução sem encerrar o stream. */
  onError?: (error: unknown, input: TInput) => void;
}

export interface SearchStream<TInput, TOutput> {
  /** Empurra um novo valor bruto (ex.: cada tecla digitada). */
  next(input: TInput): void;
  /** Assina os resultados das execuções que não foram canceladas. */
  subscribe(observer: ReactiveObserver<TOutput>): ReactiveSubscription;
  /** Encerra o stream e aborta a execução pendente. */
  dispose(): void;
}

/**
 * Pipeline de busca: `debounceTime` → `distinctUntilChanged` → `switchMap`
 * com `AbortSignal`. Só produz valores estabilizados; não guarda dados de
 * servidor (o cache continua no TanStack Query).
 */
export function createSearchStream<TInput, TOutput>({
  debounceMs,
  execute,
  isEqual = Object.is,
  onError,
}: SearchStreamOptions<TInput, TOutput>): SearchStream<TInput, TOutput> {
  const input$ = new Subject<TInput>();

  const output$ = input$.pipe(
    debounceTime(debounceMs),
    distinctUntilChanged(isEqual),
    switchMap((input) => runAbortable(input, execute, onError)),
  );

  return {
    next: (input) => input$.next(input),
    subscribe: (observer) => output$.subscribe(observer),
    dispose: () => input$.complete(),
  };
}

function runAbortable<TInput, TOutput>(
  input: TInput,
  execute: SearchStreamOptions<TInput, TOutput>["execute"],
  onError: SearchStreamOptions<TInput, TOutput>["onError"],
) {
  return new Observable<TOutput>((subscriber) => {
    const controller = new AbortController();
    let settled = false;

    const emit = (value: TOutput) => {
      settled = true;
      subscriber.next(value);
      subscriber.complete();
    };
    const fail = (error: unknown) => {
      settled = true;
      if (!controller.signal.aborted) onError?.(error, input);
      subscriber.complete();
    };

    try {
      const result = execute(input, controller.signal);
      if (isPromiseLike(result)) {
        result.then(emit, fail);
      } else {
        emit(result);
      }
    } catch (error) {
      fail(error);
    }

    // Executado quando o switchMap troca para um valor mais novo.
    return () => {
      if (!settled) controller.abort();
    };
  });
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<T>).then === "function"
  );
}
