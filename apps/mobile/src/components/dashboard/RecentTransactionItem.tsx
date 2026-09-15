import { formatCalendarDate, formatCurrencyFromCents } from "@banking/shared/domain";
import type { Transaction } from "@banking/shared/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface RecentTransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export function RecentTransactionItem({
  transaction,
  onPress,
}: RecentTransactionItemProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const isIncome = transaction.type === "income";
  const formattedAmount = formatCurrencyFromCents(transaction.amountInCents);
  const formattedDate = formatCalendarDate(transaction.date);
  const statusLabel = {
    completed: "Concluída",
    pending: "Pendente",
    failed: "Falhou",
  }[transaction.status];
  const amountPrefix = isIncome ? "+" : "−";
  const readableType = isIncome ? "entrada" : "saída";
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const iconColor = isIncome
    ? isDark
      ? palette.success
      : "#0f7a55"
    : palette.danger;

  return (
    <Pressable
      accessibilityLabel={`${transaction.description}, ${transaction.category}, ${readableType} de ${formattedAmount}, ${formattedDate}, status ${statusLabel}`}
      accessibilityRole="button"
      className="min-h-[76px] flex-row items-center gap-3 border-b border-bytebank-border py-3 active:opacity-70 dark:border-bytebank-dark-border"
      onPress={() => onPress?.(transaction)}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-card ${
          isIncome
            ? "bg-bytebank-success/15 dark:bg-bytebank-dark-success/15"
            : "bg-bytebank-danger/15 dark:bg-bytebank-dark-danger/15"
        }`}
      >
        <Icon aria-hidden color={iconColor} size={19} strokeWidth={2.2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text"
        >
          {transaction.description}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-1 text-xs text-bytebank-muted dark:text-bytebank-dark-muted"
        >
          {transaction.category} · {formattedDate}
        </Text>
      </View>
      <View className="items-end pl-2">
        <Text
          className={
            isIncome
              ? "text-sm font-bold text-bytebank-success dark:text-bytebank-dark-success"
              : "text-sm font-bold text-bytebank-danger dark:text-bytebank-dark-danger"
          }
        >
          {amountPrefix} {formattedAmount}
        </Text>
        <Text className="mt-1 text-[11px] text-bytebank-muted dark:text-bytebank-dark-muted">
          {statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}
