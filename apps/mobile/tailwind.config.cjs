/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bytebank: {
          background: "#fcfcfc",
          surface: "#f3f5f7",
          elevated: "#ffffff",
          primary: "#0e7f84",
          "primary-strong": "#09636a",
          accent: "#0e7f84",
          text: "#151b23",
          muted: "#576575",
          border: "#d9dee4",
          success: "#0f7a55",
          warning: "#f59e0b",
          danger: "#b91e1e",
          dark: {
            background: "#0a0e15",
            surface: "#121821",
            elevated: "#151d28",
            primary: "#17c5ce",
            text: "#f3f5f7",
            muted: "#96a3b2",
            border: "#25303d",
            success: "#19e09b",
            warning: "#fbbf24",
            danger: "#ef6c6c",
          },
        },
      },
      borderRadius: {
        card: "16px",
        panel: "24px",
      },
      spacing: {
        4.5: "18px",
      },
      boxShadow: {
        card: "0 6px 16px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
