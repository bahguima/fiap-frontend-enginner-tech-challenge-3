import {
  Observable,
  defer,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  share,
  startWith,
  switchMap,
  throttleTime,
  timer,
  type OperatorFunction,
} from "rxjs";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

/** Intervalo mínimo entre eventos de atividade repassados (evita ruído de mousemove). */
export const ACTIVITY_THROTTLE_MS = 250;

export interface ActivityTargets {
  window: Window;
  document: Document;
}

/**
 * Stream de atividade do usuário: mouse, teclado, roda, toque e o retorno da
 * aba ao primeiro plano (`visibilitychange` → `visible`). Emite o horário do
 * evento (ms epoch).
 */
export function createActivityStream(
  targets?: ActivityTargets,
): Observable<number> {
  return defer(() => {
    const win = targets?.window ?? window;
    const doc = targets?.document ?? document;

    const inputEvents = ACTIVITY_EVENTS.map((type) =>
      fromEvent(win, type, { passive: true }),
    );
    const becameVisible = fromEvent(doc, "visibilitychange").pipe(
      filter(() => doc.visibilityState === "visible"),
    );

    return merge(...inputEvents, becameVisible).pipe(
      throttleTime(ACTIVITY_THROTTLE_MS),
      map(() => Date.now()),
    );
  });
}

/** Atividade global, compartilhada entre assinantes enquanto houver algum. */
export const activity$ = createActivityStream().pipe(share());

/**
 * Operador `idle(ms)`: transforma um stream de atividade em `true` após `ms`
 * sem eventos e `false` assim que houver atividade. Começa em `false`.
 */
export function idle<T>(ms: number): OperatorFunction<T, boolean> {
  return (source) =>
    source.pipe(
      startWith(null),
      switchMap(() =>
        timer(ms).pipe(
          map(() => true),
          startWith(false),
        ),
      ),
      distinctUntilChanged(),
    );
}
