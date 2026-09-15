import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { darkColors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  prominent?: boolean;
}

export function QuickActionButton({
  icon: Icon,
  label,
  onPress,
  prominent = false,
}: QuickActionButtonProps) {
  const { isDark } = useMobileTheme();
  const iconColor = prominent
    ? isDark
      ? darkColors.background
      : "#ffffff"
    : isDark
      ? darkColors.primary
      : "#0e7f84";

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={
        prominent
          ? "min-h-[72px] min-w-0 flex-1 items-center justify-center gap-2 rounded-card bg-bytebank-primary px-2 active:bg-bytebank-primary-strong dark:bg-bytebank-dark-primary"
          : "min-h-[72px] min-w-0 flex-1 items-center justify-center gap-2 rounded-card border border-bytebank-border bg-bytebank-surface px-2 active:opacity-70 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
      }
      onPress={onPress}
    >
      <View className="h-6 items-center justify-center">
        <Icon aria-hidden color={iconColor} size={21} strokeWidth={2.2} />
      </View>
      <Text
        numberOfLines={2}
        className={
          prominent
            ? "text-center text-xs font-bold text-white dark:text-bytebank-dark-background"
            : "text-center text-xs font-semibold text-bytebank-text dark:text-bytebank-dark-text"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
