import { Moon, Sun } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface MobileAppHeaderProps {
  greeting?: string;
  title?: string;
}

export function MobileAppHeader({
  greeting = "Olá, Maria",
  title = "ByteBank",
}: MobileAppHeaderProps) {
  const { isDark, toggleTheme } = useMobileTheme();
  const iconColor = isDark ? darkColors.text : colors.text;

  return (
    <View
      accessibilityRole="header"
      className="flex-row items-center justify-between border-b border-bytebank-border py-4 dark:border-bytebank-dark-border"
    >
      <View className="min-w-0 flex-1 pr-4">
        <Text
          allowFontScaling
          className="text-xs font-semibold uppercase tracking-[1.5px] text-bytebank-primary dark:text-bytebank-dark-primary"
        >
          {title}
        </Text>
        <Text
          allowFontScaling
          accessibilityRole="header"
          className="mt-1 text-xl font-bold text-bytebank-text dark:text-bytebank-dark-text"
        >
          {greeting}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        accessibilityRole="button"
        className="h-12 w-12 items-center justify-center rounded-full bg-bytebank-surface active:opacity-70 dark:bg-bytebank-dark-surface"
        hitSlop={8}
        onPress={toggleTheme}
      >
        {isDark ? (
          <Sun aria-hidden color={iconColor} size={21} strokeWidth={2} />
        ) : (
          <Moon aria-hidden color={iconColor} size={21} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );
}
