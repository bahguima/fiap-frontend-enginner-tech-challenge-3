import { createSearchStream } from "./searchStream";

describe("createSearchStream", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("aplica debounce e só executa o último valor estabilizado", () => {
    const execute = jest.fn((term: string) => term.toUpperCase());
    const results: string[] = [];
    const stream = createSearchStream({ debounceMs: 300, execute });
    stream.subscribe({ next: (value) => results.push(value) });

    stream.next("m");
    jest.advanceTimersByTime(100);
    stream.next("me");
    jest.advanceTimersByTime(100);
    stream.next("mer");
    jest.advanceTimersByTime(299);

    expect(execute).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith("mer", expect.any(AbortSignal));
    expect(results).toEqual(["MER"]);

    stream.dispose();
  });

  it("ignora valores iguais ao último estabilizado (distinctUntilChanged)", () => {
    const execute = jest.fn((filters: { search: string }) => filters);
    const stream = createSearchStream({
      debounceMs: 200,
      execute,
      isEqual: (previous, current) => previous.search === current.search,
    });
    stream.subscribe({});

    stream.next({ search: "pix" });
    jest.advanceTimersByTime(200);
    stream.next({ search: "pix" });
    jest.advanceTimersByTime(200);

    expect(execute).toHaveBeenCalledTimes(1);
    stream.dispose();
  });

  it("aborta a requisição obsoleta e descarta seu resultado", async () => {
    const signals: AbortSignal[] = [];
    const execute = jest.fn(
      (term: string, signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          signals.push(signal);
          setTimeout(() => resolve(`resultado:${term}`), 1_000);
        }),
    );
    const results: string[] = [];
    const stream = createSearchStream({ debounceMs: 300, execute });
    stream.subscribe({ next: (value) => results.push(value) });

    stream.next("mercado");
    jest.advanceTimersByTime(300);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(signals[0].aborted).toBe(false);

    // Novo termo chega enquanto a primeira requisição ainda está pendente.
    stream.next("salário");
    jest.advanceTimersByTime(300);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(1_000);

    expect(results).toEqual(["resultado:salário"]);
    stream.dispose();
  });

  it("aborta a requisição pendente ao descartar o stream", () => {
    let capturedSignal: AbortSignal | undefined;
    const stream = createSearchStream({
      debounceMs: 100,
      execute: (_term: string, signal) => {
        capturedSignal = signal;
        return new Promise<string>(() => undefined);
      },
    });
    const subscription = stream.subscribe({});

    stream.next("pix");
    jest.advanceTimersByTime(100);
    subscription.unsubscribe();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("reporta falhas sem encerrar o stream", async () => {
    const onError = jest.fn();
    const results: string[] = [];
    const stream = createSearchStream({
      debounceMs: 100,
      execute: async (term: string) => {
        if (term === "erro") throw new Error("falhou");
        return term;
      },
      onError,
    });
    stream.subscribe({ next: (value) => results.push(value) });

    stream.next("erro");
    await jest.advanceTimersByTimeAsync(100);
    stream.next("ok");
    await jest.advanceTimersByTimeAsync(100);

    expect(onError).toHaveBeenCalledWith(expect.any(Error), "erro");
    expect(results).toEqual(["ok"]);
    stream.dispose();
  });
});
