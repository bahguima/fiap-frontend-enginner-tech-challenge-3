import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  includeBottomInset?: boolean;
  testID?: string;
}

export function ScreenContainer({
  children,
  scroll = true,
  includeBottomInset = false,
  testID,
}: ScreenContainerProps) {
  const { isDark } = useMobileTheme();
  const themeClass = isDark ? "dark" : "";
  const edges = includeBottomInset
    ? (["top", "right", "bottom", "left"] as const)
    : (["top", "right", "left"] as const);

  return (
    <SafeAreaView
      className={`${themeClass} flex-1 ${
        isDark ? "bg-bytebank-dark-background" : "bg-bytebank-background"
      }`}
      edges={edges}
      testID={testID}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      {scroll ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets
            className="flex-1"
            contentContainerClassName="grow pb-10"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-4xl self-center px-4 sm:px-6">
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1 w-full max-w-4xl self-center px-4 sm:px-6">
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
