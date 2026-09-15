import { useRouter, type Href } from "expo-router";

import { DashboardScreen } from "@mobile/screens/DashboardScreen";

export default function DashboardRoute() {
  const router = useRouter();

  return (
    <DashboardScreen
      onAddTransaction={() => router.push("/transactions/new" as Href)}
      onShowAllTransactions={() => router.push("/transactions" as Href)}
      onShowExpenses={() =>
        router.push(
          { pathname: "/transactions", params: { type: "expense" } } as unknown as Href,
        )
      }
      onShowIncome={() =>
        router.push(
          { pathname: "/transactions", params: { type: "income" } } as unknown as Href,
        )
      }
    />
  );
}
