import { ActivityIndicator, Text, View } from "react-native";

import { colors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

export function InitialSessionLoading() {
  const { isDark } = useMobileTheme();

  return (
    <View
      accessibilityLabel="Restaurando sua sessão"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      className={`${isDark ? "dark bg-bytebank-dark-background" : "bg-bytebank-background"} flex-1 items-center justify-center gap-4 px-6`}
      testID="initial-session-loading"
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className="text-center text-base font-semibold text-bytebank-text dark:text-bytebank-dark-text">
        Restaurando sua sessão...
      </Text>
    </View>
  );
}
