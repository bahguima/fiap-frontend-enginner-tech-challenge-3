import { act, render, screen } from "@testing-library/react";

import { createOnlineStream } from "./online";
import { useOnlineStatus } from "./hooks";

const setNavigatorOnline = (value: boolean) =>
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });

describe("online$", () => {
  afterEach(() => setNavigatorOnline(true));

  it("emite o estado inicial e as transições online/offline sem repetir", () => {
    setNavigatorOnline(true);
    const states: boolean[] = [];
    const subscription = createOnlineStream().subscribe((value) =>
      states.push(value),
    );

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(states).toEqual([true, false, true]);
    subscription.unsubscribe();
  });

  it("useOnlineStatus acompanha a conectividade", () => {
    setNavigatorOnline(false);

    function Probe() {
      return <p>{useOnlineStatus() ? "online" : "offline"}</p>;
    }

    render(<Probe />);
    expect(screen.getByText("offline")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByText("online")).toBeInTheDocument();
  });
});
