import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, List, Plus, UserRound } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

const items = [
  { route: "index", label: "Início", icon: Home },
  { route: "transactions", label: "Transações", icon: List },
  { route: "profile", label: "Perfil", icon: UserRound },
] as const;

export function MobileBottomNavigation({
  state,
  navigation,
}: BottomTabBarProps) {
  const router = useRouter();
  const { isDark } = useMobileTheme();
  const themeClass = isDark ? "dark" : "";
  const palette = isDark ? darkColors : colors;

  const renderItem = (item: (typeof items)[number]) => {
    const routeIndex = state.routes.findIndex((route) => route.name === item.route);
    const route = state.routes[routeIndex];
    const active = state.index === routeIndex;
    const Icon = item.icon;

    return (
      <Pressable
        key={item.route}
        accessibilityLabel={item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        className="min-h-16 min-w-0 flex-1 items-center justify-center gap-1 px-1 active:opacity-60"
        onPress={() => {
          if (route) navigation.navigate(route.name, route.params);
        }}
      >
        <Icon
          aria-hidden
          color={active ? palette.primary : palette.muted}
          size={21}
          strokeWidth={active ? 2.5 : 2}
        />
        <Text
          numberOfLines={1}
          className={
            active
              ? "text-[11px] font-bold text-bytebank-primary dark:text-bytebank-dark-primary"
              : "text-[11px] font-medium text-bytebank-muted dark:text-bytebank-dark-muted"
          }
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      className={`${themeClass} border-t ${
        isDark
          ? "border-bytebank-dark-border bg-bytebank-dark-elevated"
          : "border-bytebank-border bg-bytebank-elevated"
      }`}
      edges={["bottom", "left", "right"]}
    >
      <View accessibilityRole="tablist" className="h-[68px] flex-row items-center px-2">
        {renderItem(items[0])}
        {renderItem(items[1])}
        <Pressable
          accessibilityLabel="Adicionar transação"
          accessibilityRole="button"
          className="min-h-16 min-w-0 flex-1 items-center justify-center gap-1 px-1 active:opacity-70"
          onPress={() => router.push("/transactions/new" as Href)}
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-bytebank-primary shadow-lg dark:bg-bytebank-dark-primary">
            <Plus
              aria-hidden
              color={isDark ? darkColors.background : "#ffffff"}
              size={24}
              strokeWidth={2.5}
            />
          </View>
          <Text className="text-[11px] font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
            Adicionar
          </Text>
        </Pressable>
        {renderItem(items[2])}
      </View>
    </SafeAreaView>
  );
}
