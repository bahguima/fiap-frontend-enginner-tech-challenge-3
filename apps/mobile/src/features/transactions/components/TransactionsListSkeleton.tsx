import { View } from "react-native";

export function TransactionsListSkeleton() {
  return (
    <View accessibilityLabel="Carregando transações" accessibilityRole="progressbar">
      {[0, 1, 2, 3].map((item) => (
        <View
          className="mb-3 min-h-[84px] flex-row items-center gap-3 rounded-card border border-bytebank-border bg-bytebank-surface px-4 py-3 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
          key={item}
        >
          <View className="h-11 w-11 rounded-card bg-bytebank-border dark:bg-bytebank-dark-border" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-2/3 rounded-full bg-bytebank-border dark:bg-bytebank-dark-border" />
            <View className="h-3 w-1/2 rounded-full bg-bytebank-border dark:bg-bytebank-dark-border" />
          </View>
          <View className="h-4 w-20 rounded-full bg-bytebank-border dark:bg-bytebank-dark-border" />
        </View>
      ))}
    </View>
  );
}
