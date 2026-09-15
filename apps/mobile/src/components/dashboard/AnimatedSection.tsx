import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Platform } from "react-native";

import { useReducedMotion } from "@mobile/features/dashboard/hooks/useReducedMotion";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  transitionKey?: string | number;
}

export function AnimatedSection({
  children,
  delay = 0,
  transitionKey = "section",
}: AnimatedSectionProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      delay,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduceMotion, transitionKey]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{
          translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
        }],
      }}
    >
      {children}
    </Animated.View>
  );
}
