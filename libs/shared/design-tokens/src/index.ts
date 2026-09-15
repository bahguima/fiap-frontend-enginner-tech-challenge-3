export const colors = {
  background: "#fcfcfc",
  surface: "#f3f5f7",
  elevated: "#ffffff",
  primary: "#129fa5",
  primaryStrong: "#0e7f84",
  accent: "#129fa5",
  text: "#151b23",
  muted: "#576575",
  border: "#d9dee4",
  success: "#0aba76",
  warning: "#f59e0b",
  danger: "#b91e1e",
} as const;

export const darkColors = {
  background: "#0a0e15",
  surface: "#121821",
  elevated: "#151d28",
  primary: "#17c5ce",
  primaryStrong: "#129fa5",
  accent: "#17c5ce",
  text: "#f3f5f7",
  muted: "#96a3b2",
  border: "#25303d",
  success: "#19e09b",
  warning: "#fbbf24",
  danger: "#ef6c6c",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radii = { sm: 8, md: 16, lg: 24, pill: 999 } as const;
export const typography = {
  fontSize: { caption: 12, label: 14, body: 16, title: 24, display: 32 },
  fontWeight: { regular: "400", semibold: "600", bold: "700" },
} as const;

export const shadows = {
  card: {
    color: "#0f172a",
    opacity: 0.08,
    radius: 16,
    offsetY: 6,
    elevation: 3,
  },
} as const;

export const designTokens = {
  colors,
  darkColors,
  spacing,
  radii,
  typography,
  shadows,
} as const;
