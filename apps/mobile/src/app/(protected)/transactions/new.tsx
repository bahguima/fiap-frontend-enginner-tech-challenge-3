import { useRouter, type Href } from "expo-router";

import { NewTransactionScreen } from "@mobile/screens/NewTransactionScreen";

export default function NewTransactionRoute() {
  const router = useRouter();
  const returnToTransactions = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/transactions" as Href);
  };

  return (
    <NewTransactionScreen
      onBack={returnToTransactions}
      onSaved={() => router.replace("/transactions" as Href)}
    />
  );
}
