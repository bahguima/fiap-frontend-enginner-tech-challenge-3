import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { TransactionDetailsScreen } from "@mobile/screens/TransactionDetailsScreen";

export default function TransactionDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <TransactionDetailsScreen
      id={id}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/transactions" as Href);
        }
      }}
      onDeleted={() => router.replace("/transactions" as Href)}
      onEdit={() =>
        router.push({
          pathname: "/transactions/[id]/edit",
          params: { id },
        } as never)
      }
    />
  );
}
