import { AlertCircle, CheckCircle2, Inbox, LoaderCircle } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

export type QueryStateKind = "loading" | "error" | "empty" | "success";

interface QueryStateProps {
  kind: QueryStateKind;
  title?: string;
  message: string;
  onRetry?: () => void;
}

const defaultTitles: Record<QueryStateKind, string> = {
  loading: "Carregando",
  error: "Algo não saiu como esperado",
  empty: "Nada por aqui ainda",
  success: "Tudo certo",
};

export function QueryState({ kind, title, message, onRetry }: QueryStateProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const iconColor =
    kind === "error"
      ? palette.danger
      : kind === "success"
        ? palette.success
        : palette.primary;
  const Icon =
    kind === "error"
      ? AlertCircle
      : kind === "empty"
        ? Inbox
        : kind === "success"
          ? CheckCircle2
          : LoaderCircle;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={kind === "error" ? "alert" : "summary"}
      className="items-center rounded-panel border border-bytebank-border bg-bytebank-surface px-6 py-10 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-bytebank-dark-elevated">
        <Icon aria-hidden color={iconColor} size={24} />
      </View>
      <Text
        accessibilityRole="header"
        className="mt-4 text-center text-lg font-bold text-bytebank-text dark:text-bytebank-dark-text"
      >
        {title ?? defaultTitles[kind]}
      </Text>
      <Text className="mt-2 text-center text-sm leading-5 text-bytebank-muted dark:text-bytebank-dark-muted">
        {message}
      </Text>
      {kind === "error" && onRetry ? (
        <Pressable
          accessibilityLabel="Tentar novamente"
          accessibilityRole="button"
          className="mt-5 min-h-12 justify-center rounded-card bg-bytebank-primary px-5 active:bg-bytebank-primary-strong dark:bg-bytebank-dark-primary"
          onPress={onRetry}
        >
          <Text className="font-bold text-white dark:text-bytebank-dark-background">
            Tentar novamente
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
