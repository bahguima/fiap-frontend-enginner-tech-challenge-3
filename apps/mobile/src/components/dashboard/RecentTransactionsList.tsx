import type { Transaction } from "@banking/shared/types";
import { FlatList, Text, View } from "react-native";

import { QueryState } from "@mobile/components/states/QueryState";
import { RecentTransactionItem } from "./RecentTransactionItem";

interface RecentTransactionsListProps {
  transactions: Transaction[];
  title?: string;
  scrollEnabled?: boolean;
  onTransactionPress?: (transaction: Transaction) => void;
}

export function RecentTransactionsList({
  transactions,
  title = "Transações recentes",
  scrollEnabled = false,
  onTransactionPress,
}: RecentTransactionsListProps) {
  return (
    <View className="rounded-panel border border-bytebank-border bg-bytebank-surface px-4 pt-5 shadow-card dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface">
      <Text
        accessibilityRole="header"
        className="px-1 text-lg font-bold text-bytebank-text dark:text-bytebank-dark-text"
      >
        {title}
      </Text>
      {transactions.length === 0 ? (
        <View className="pb-4 pt-4">
          <QueryState kind="empty" message="Nenhuma transação encontrada." />
        </View>
      ) : (
        <FlatList
          accessibilityLabel={title}
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecentTransactionItem
              onPress={onTransactionPress}
              transaction={item}
            />
          )}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
