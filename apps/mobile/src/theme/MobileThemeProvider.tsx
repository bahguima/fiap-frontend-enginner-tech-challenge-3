import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

type MobileTheme = "light" | "dark";

interface MobileThemeContextValue {
  theme: MobileTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const MobileThemeContext = createContext<MobileThemeContextValue | null>(null);

export function MobileThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<MobileTheme>(
    systemTheme === "dark" ? "dark" : "light",
  );
  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <MobileThemeContext.Provider value={value}>
      {children}
    </MobileThemeContext.Provider>
  );
}

export function useMobileTheme() {
  const context = useContext(MobileThemeContext);

  if (!context) {
    throw new Error("useMobileTheme deve ser usado dentro de MobileThemeProvider.");
  }

  return context;
}
