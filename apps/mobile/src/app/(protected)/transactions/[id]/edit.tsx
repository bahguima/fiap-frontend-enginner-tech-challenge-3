import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { TransactionFormScreen } from "@mobile/screens/NewTransactionScreen";

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const transactionPath = `/transactions/${encodeURIComponent(id)}` as Href;
  const returnToTransaction = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(transactionPath);
  };

  return (
    <TransactionFormScreen
      mode="edit"
      onBack={returnToTransaction}
      onSaved={() => router.replace(transactionPath)}
      transactionId={id}
    />
  );
}
