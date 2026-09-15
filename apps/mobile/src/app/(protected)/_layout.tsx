import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="transactions/new" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="transactions/[id]/edit"
        options={{ gestureEnabled: false }}
      />
    </Stack>
  );
}
