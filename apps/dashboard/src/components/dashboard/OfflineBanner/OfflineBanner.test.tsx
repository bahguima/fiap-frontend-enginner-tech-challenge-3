import { act, render, screen } from "@testing-library/react";

import { OfflineBanner } from ".";

const setNavigatorOnline = (value: boolean) =>
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });

describe("OfflineBanner", () => {
  afterEach(() => setNavigatorOnline(true));

  it("avisa quando a conexão cai e some quando ela volta", () => {
    setNavigatorOnline(true);
    render(<OfflineBanner />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toHaveTextContent("dash.offline");

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
