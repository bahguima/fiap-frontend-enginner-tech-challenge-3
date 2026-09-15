import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { TransactionsScreen } from "@mobile/screens/TransactionsScreen";

export default function TransactionsRoute() {
  const { type } = useLocalSearchParams<{ type?: "income" | "expense" }>();
  const router = useRouter();

  return (
    <TransactionsScreen
      initialFilter={type}
      onAddTransaction={() => router.push("/transactions/new" as Href)}
      onTransactionPress={(id) =>
        router.push(`/transactions/${encodeURIComponent(id)}` as Href)
      }
    />
  );
}
