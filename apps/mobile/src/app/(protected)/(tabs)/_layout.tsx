import { Tabs } from "expo-router";

import { MobileBottomNavigation } from "@mobile/components/navigation/MobileBottomNavigation";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <MobileBottomNavigation {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="transactions" options={{ title: "Transações" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
