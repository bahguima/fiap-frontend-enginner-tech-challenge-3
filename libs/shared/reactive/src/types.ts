/**
 * Tipos próprios da lib reativa. O restante do workspace enxerga apenas estes
 * contratos mínimos — nunca `Observable` do RxJS — para que a dependência
 * fique confinada a `libs/shared/reactive`.
 */
export interface ReactiveObserver<T> {
  next?: (value: T) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
}

export interface ReactiveSubscription {
  unsubscribe(): void;
}

/** Fonte de eventos assinável (estruturalmente compatível com RxJS). */
export interface ReactiveSource<T> {
  subscribe(observer: ReactiveObserver<T>): ReactiveSubscription;
}
