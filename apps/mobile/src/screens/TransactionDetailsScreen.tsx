import { formatCalendarDate, formatCurrencyFromCents } from "@banking/shared/domain";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { ScreenContainer } from "@mobile/components/layout/ScreenContainer";
import { QueryState } from "@mobile/components/states/QueryState";
import {
  useDeleteTransactionMutation,
  useTransactionQuery,
} from "@mobile/features/transactions/hooks";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface TransactionDetailsScreenProps {
  id?: string;
  onBack: () => void;
  onDeleted?: () => void;
  onEdit?: () => void;
}

const statusLabels = {
  completed: "Concluída",
  pending: "Pendente",
  failed: "Falhou",
} as const;

export function TransactionDetailsScreen({
  id,
  onBack,
  onDeleted = onBack,
  onEdit,
}: TransactionDetailsScreenProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const query = useTransactionQuery(id);
  const deleteMutation = useDeleteTransactionMutation();
  const transaction = query.data;

  const requestDelete = () => {
    if (!transaction || deleteMutation.isPending) return;

    if (transaction.attachmentCount > 0) {
      Alert.alert(
        "Remova os comprovantes",
        "Abra a edição e remova todos os comprovantes antes de excluir esta transação.",
        [
          { text: "Cancelar", style: "cancel" },
          ...(onEdit
            ? [{ text: "Editar transação", onPress: onEdit }]
            : []),
        ],
      );
      return;
    }

    Alert.alert(
      "Excluir transação?",
      "Esta ação é permanente e não poderá ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteMutation
              .mutateAsync(transaction.id)
              .then(() => {
                Alert.alert(
                  "Transação excluída",
                  "A transação foi removida com sucesso.",
                );
                onDeleted();
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center gap-3 border-b border-bytebank-border py-4 dark:border-bytebank-dark-border">
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bytebank-surface dark:bg-bytebank-dark-surface"
          onPress={onBack}
        >
          <ArrowLeft aria-hidden color={palette.primary} size={22} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="text-xl font-bold text-bytebank-text dark:text-bytebank-dark-text"
        >
          Detalhes da transação
        </Text>
      </View>

      <View className="pt-6">
        {query.isPending ? (
          <QueryState kind="loading" message="Carregando transação..." />
        ) : query.isError || !query.data ? (
          <QueryState
            kind="error"
            message="Não foi possível carregar esta transação."
            onRetry={() => void query.refetch()}
          />
        ) : (
          <View className="rounded-panel border border-bytebank-border bg-bytebank-surface p-5 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface">
            <Text className="text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
              {query.data.type === "income" ? "Entrada" : "Saída"}
            </Text>
            <Text className="mt-2 text-2xl font-bold text-bytebank-text dark:text-bytebank-dark-text">
              {formatCurrencyFromCents(query.data.amountInCents)}
            </Text>
            <Text className="mt-5 text-lg font-bold text-bytebank-text dark:text-bytebank-dark-text">
              {query.data.description}
            </Text>
            <Text className="mt-2 text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
              {query.data.category} · {formatCalendarDate(query.data.date)}
            </Text>
            <Text className="mt-2 text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
              Status: {statusLabels[query.data.status]}
            </Text>
            {query.data.observation ? (
              <Text className="mt-5 text-sm leading-5 text-bytebank-text dark:text-bytebank-dark-text">
                {query.data.observation}
              </Text>
            ) : null}
            {onEdit ? (
              <Pressable
                accessibilityLabel="Editar transação"
                accessibilityRole="button"
                className="mt-6 min-h-12 items-center justify-center rounded-card bg-bytebank-primary dark:bg-bytebank-dark-primary"
                onPress={onEdit}
              >
                <Text className="font-bold text-white dark:text-bytebank-dark-background">
                  Editar transação
                </Text>
              </Pressable>
            ) : null}
            {deleteMutation.isError ? (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                className="mt-4 text-sm leading-5 text-bytebank-danger dark:text-bytebank-dark-danger"
              >
                {deleteMutation.error instanceof Error
                  ? deleteMutation.error.message
                  : "Não foi possível excluir a transação. Tente novamente."}
              </Text>
            ) : null}
            <Pressable
              accessibilityHint={
                query.data.attachmentCount > 0
                  ? "É necessário remover os comprovantes na edição antes de excluir"
                  : "Solicita confirmação antes de excluir permanentemente"
              }
              accessibilityLabel={
                deleteMutation.isPending
                  ? "Excluindo transação"
                  : "Excluir transação"
              }
              accessibilityRole="button"
              accessibilityState={{
                busy: deleteMutation.isPending,
                disabled: deleteMutation.isPending,
              }}
              className={`mt-3 min-h-12 flex-row items-center justify-center gap-2 rounded-card border border-bytebank-danger dark:border-bytebank-dark-danger ${
                deleteMutation.isPending ? "opacity-60" : "active:opacity-70"
              }`}
              disabled={deleteMutation.isPending}
              onPress={requestDelete}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color={palette.danger} size="small" />
              ) : (
                <Trash2 aria-hidden color={palette.danger} size={19} />
              )}
              <Text className="font-bold text-bytebank-danger dark:text-bytebank-dark-danger">
                {deleteMutation.isPending ? "Excluindo..." : "Excluir transação"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
