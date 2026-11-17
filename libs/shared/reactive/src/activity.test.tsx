import { act, render, screen } from "@testing-library/react";
import { Subject } from "rxjs";

import { ACTIVITY_THROTTLE_MS, createActivityStream, idle } from "./activity";
import { useIdle } from "./hooks";

describe("idle(ms)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("emite true após o período sem atividade e false ao retomar", () => {
    const activity = new Subject<void>();
    const states: boolean[] = [];
    const subscription = activity
      .pipe(idle(1_000))
      .subscribe((value) => states.push(value));

    expect(states).toEqual([false]);

    jest.advanceTimersByTime(999);
    expect(states).toEqual([false]);

    jest.advanceTimersByTime(1);
    expect(states).toEqual([false, true]);

    activity.next();
    expect(states).toEqual([false, true, false]);

    // Atividade contínua reinicia o relógio.
    jest.advanceTimersByTime(600);
    activity.next();
    jest.advanceTimersByTime(600);
    expect(states).toEqual([false, true, false]);

    jest.advanceTimersByTime(400);
    expect(states).toEqual([false, true, false, true]);

    subscription.unsubscribe();
  });
});

describe("createActivityStream", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("reage a mouse, teclado, toque e retorno da aba, com throttle", () => {
    const events: number[] = [];
    const subscription = createActivityStream().subscribe((timestamp) =>
      events.push(timestamp),
    );

    window.dispatchEvent(new Event("mousemove"));
    window.dispatchEvent(new Event("mousemove"));
    expect(events).toHaveLength(1);

    jest.advanceTimersByTime(ACTIVITY_THROTTLE_MS);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(events).toHaveLength(2);

    jest.advanceTimersByTime(ACTIVITY_THROTTLE_MS);
    window.dispatchEvent(new Event("touchstart"));
    expect(events).toHaveLength(3);

    jest.advanceTimersByTime(ACTIVITY_THROTTLE_MS);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(events).toHaveLength(4);

    subscription.unsubscribe();
  });
});

function IdleProbe({ ms }: { ms: number }) {
  const isIdle = useIdle(ms);
  return <p role="status">{isIdle ? "inativo" : "ativo"}</p>;
}

describe("useIdle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("marca o usuário como inativo após o tempo e reativa com interação", () => {
    render(<IdleProbe ms={5_000} />);

    expect(screen.getByRole("status")).toHaveTextContent("ativo");

    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("inativo");

    act(() => {
      window.dispatchEvent(new Event("mousedown"));
    });
    expect(screen.getByRole("status")).toHaveTextContent("ativo");
  });
});
