import { ChevronDown } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, Text } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useReducedMotion } from "@mobile/features/dashboard/hooks/useReducedMotion";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface AnimatedDisclosureProps {
  children: ReactNode;
  label: string;
  maximumHeight?: number;
}

export function AnimatedDisclosure({
  children,
  label,
  maximumHeight = 720,
}: AnimatedDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;

  useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion) {
      progress.setValue(expanded ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, progress, reduceMotion]);

  return (
    <>
      <Pressable
        accessibilityLabel={`${expanded ? "Ocultar" : "Exibir"} ${label}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="mt-4 min-h-11 flex-row items-center justify-center gap-2 rounded-card active:opacity-60"
        onPress={() => setExpanded((current) => !current)}
      >
        <Text className="text-sm font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
          {expanded ? "Ocultar dados" : "Ver dados em tabela"}
        </Text>
        <Animated.View
          style={{
            transform: [{
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "180deg"],
              }),
            }],
          }}
        >
          <ChevronDown aria-hidden color={isDark ? palette.primary : "#0e7f84"} size={18} />
        </Animated.View>
      </Pressable>
      <Animated.View
        importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
        pointerEvents={expanded ? "auto" : "none"}
        style={{
          maxHeight: progress.interpolate({ inputRange: [0, 1], outputRange: [0, maximumHeight] }),
          opacity: progress,
          overflow: "hidden",
        }}
      >
        {children}
      </Animated.View>
    </>
  );
}
