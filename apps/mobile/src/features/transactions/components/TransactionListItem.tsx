import { formatCalendarDate, formatCurrencyFromCents } from "@banking/shared/domain";
import type { Transaction } from "@banking/shared/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface TransactionListItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

const statusLabels: Record<Transaction["status"], string> = {
  completed: "Concluída",
  pending: "Pendente",
  failed: "Falhou",
};

function TransactionListItemComponent({
  transaction,
  onPress,
}: TransactionListItemProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const isIncome = transaction.type === "income";
  const formattedAmount = formatCurrencyFromCents(transaction.amountInCents);
  const formattedDate = formatCalendarDate(transaction.date);
  const typeLabel = isIncome ? "entrada" : "saída";
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

  return (
    <Pressable
      accessibilityHint="Abre os detalhes da transação"
      accessibilityLabel={`${transaction.description}, ${transaction.category}, ${typeLabel} de ${formattedAmount}, ${formattedDate}, status ${statusLabels[transaction.status]}`}
      accessibilityRole="button"
      className="mb-3 min-h-[84px] flex-row items-center gap-3 rounded-card border border-bytebank-border bg-bytebank-surface px-4 py-3 active:opacity-70 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
      onPress={() => onPress(transaction)}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-card ${
          isIncome
            ? "bg-bytebank-success/15 dark:bg-bytebank-dark-success/15"
            : "bg-bytebank-danger/15 dark:bg-bytebank-dark-danger/15"
        }`}
      >
        <Icon
          aria-hidden
          color={isIncome ? palette.success : palette.danger}
          size={19}
          strokeWidth={2.2}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text"
          numberOfLines={1}
        >
          {transaction.description}
        </Text>
        <Text
          className="mt-1 text-xs text-bytebank-muted dark:text-bytebank-dark-muted"
          numberOfLines={1}
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
          {isIncome ? "+" : "−"} {formattedAmount}
        </Text>
        <Text className="mt-1 text-[11px] text-bytebank-muted dark:text-bytebank-dark-muted">
          {statusLabels[transaction.status]}
        </Text>
      </View>
    </Pressable>
  );
}

export const TransactionListItem = memo(TransactionListItemComponent);
