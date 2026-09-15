import { renderHook, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { useReducedMotion } from "./useReducedMotion";

describe("useReducedMotion", () => {
  afterEach(() => jest.restoreAllMocks());

  it("keeps motion disabled until the platform preference is known", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);

    const { result, unmount } = renderHook(useReducedMotion);
    expect(result.current).toBe(true);
    await waitFor(() => expect(result.current).toBe(false));

    unmount();
  });

  it("preserves the reduced-motion preference", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);

    const { result } = renderHook(useReducedMotion);
    await waitFor(() => expect(result.current).toBe(true));
  });
});
