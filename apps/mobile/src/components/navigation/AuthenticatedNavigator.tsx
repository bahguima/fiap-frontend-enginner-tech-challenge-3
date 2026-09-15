import { Stack } from "expo-router";

import { InitialSessionLoading } from "@mobile/components/states/InitialSessionLoading";
import { useAuth } from "@mobile/providers/AuthContext";

export function AuthenticatedNavigator() {
  const { isInitializing, session } = useAuth();

  if (isInitializing) {
    return <InitialSessionLoading />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
    </Stack>
  );
}
