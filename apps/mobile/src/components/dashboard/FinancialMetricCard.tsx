import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Platform, Text, View } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useReducedMotion } from "@mobile/features/dashboard/hooks/useReducedMotion";
import type { DashboardMetricViewModel } from "@mobile/features/dashboard/types";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

export type FinancialMetricTone = "primary" | "success" | "expense";

interface FinancialMetricCardProps {
  metric: DashboardMetricViewModel;
  icon: LucideIcon;
  tone: FinancialMetricTone;
  featured?: boolean;
}

const iconBoxClasses: Record<FinancialMetricTone, string> = {
  primary: "bg-bytebank-primary/15 dark:bg-bytebank-dark-primary/15",
  success: "bg-bytebank-success/15 dark:bg-bytebank-dark-success/15",
  expense: "bg-bytebank-danger/15 dark:bg-bytebank-dark-danger/15",
};

export function FinancialMetricCard({
  metric,
  icon: Icon,
  tone,
  featured = false,
}: FinancialMetricCardProps) {
  const { isDark } = useMobileTheme();
  const reduceMotion = useReducedMotion();
  const updateProgress = useRef(new Animated.Value(1)).current;
  const palette = isDark ? darkColors : colors;
  const iconColor = featured
    ? "#ffffff"
    : tone === "success"
      ? isDark
        ? palette.success
        : "#0f7a55"
      : tone === "expense"
        ? palette.danger
        : isDark
          ? palette.primary
          : "#0e7f84";

  useEffect(() => {
    updateProgress.stopAnimation();
    if (reduceMotion) {
      updateProgress.setValue(1);
      return;
    }
    updateProgress.setValue(0.94);
    const animation = Animated.spring(updateProgress, {
      toValue: 1,
      speed: 18,
      bounciness: 4,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [metric.valueInCents, reduceMotion, updateProgress]);

  return (
    <Animated.View
      style={{ opacity: updateProgress, transform: [{ scale: updateProgress }] }}
    >
      <View
        accessible
        accessibilityLabel={`${metric.label}: ${metric.formattedValue}. ${metric.comparisonText}.`}
        className={
          featured
            ? "min-w-0 rounded-panel bg-bytebank-primary p-5 shadow-card dark:bg-bytebank-dark-primary"
            : "min-w-0 rounded-card border border-bytebank-border bg-bytebank-surface p-4 shadow-card dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
        }
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className={
              featured
                ? "text-sm font-semibold text-white/80 dark:text-bytebank-dark-background/70"
                : "text-sm font-medium text-bytebank-muted dark:text-bytebank-dark-muted"
            }
          >
            {metric.label}
          </Text>
          <View
            className={`h-9 w-9 items-center justify-center rounded-card ${
              featured ? "bg-white/15" : iconBoxClasses[tone]
            }`}
          >
            <Icon aria-hidden color={iconColor} size={18} strokeWidth={2.2} />
          </View>
        </View>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.76}
          numberOfLines={1}
          className={
            featured
              ? "mt-4 text-[30px] font-bold tracking-tight text-white dark:text-bytebank-dark-background"
              : "mt-4 text-xl font-bold tracking-tight text-bytebank-text dark:text-bytebank-dark-text sm:text-2xl"
          }
        >
          {metric.formattedValue}
        </Text>
        <Text
          className={
            featured
              ? "mt-2 text-xs leading-4 text-white/80 dark:text-bytebank-dark-background/70"
              : metric.comparisonTone === "negative"
                ? "mt-2 text-xs leading-4 text-bytebank-danger dark:text-bytebank-dark-danger"
                : "mt-2 text-xs leading-4 text-bytebank-success dark:text-bytebank-dark-success"
          }
        >
          {metric.comparisonText}
        </Text>
      </View>
    </Animated.View>
  );
}
