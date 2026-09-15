import type { ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MobileThemeProvider } from "@mobile/theme/MobileThemeProvider";

export function renderWithTheme(element: ReactElement) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <MobileThemeProvider>{element}</MobileThemeProvider>
    </SafeAreaProvider>,
  );
}
