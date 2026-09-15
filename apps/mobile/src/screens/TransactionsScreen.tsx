import type { Transaction, TransactionType } from "@banking/shared/types";
import { colors, darkColors } from "@banking/shared/design-tokens";
import { Filter, Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { MobileAppHeader } from "@mobile/components/layout/MobileAppHeader";
import { ScreenContainer } from "@mobile/components/layout/ScreenContainer";
import { QueryState } from "@mobile/components/states/QueryState";
import { TransactionListItem } from "@mobile/features/transactions/components/TransactionListItem";
import { TransactionsFilterModal } from "@mobile/features/transactions/components/TransactionsFilterModal";
import { TransactionsListSkeleton } from "@mobile/features/transactions/components/TransactionsListSkeleton";
import {
  useTransactionCategoriesQuery,
  useTransactionsInfiniteQuery,
} from "@mobile/features/transactions/hooks";
import type { TransactionFilters } from "@mobile/features/transactions/types/transactions";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

const DEFAULT_FILTERS: TransactionFilters = {
  pageSize: 20,
  sort: "date-desc",
};

interface TransactionsScreenProps {
  initialFilter?: TransactionType;
  onAddTransaction?: () => void;
  onTransactionPress?: (transactionId: string) => void;
}

function createInitialFilters(initialFilter?: TransactionType): TransactionFilters {
  return {
    ...DEFAULT_FILTERS,
    ...(initialFilter ? { type: initialFilter } : {}),
  };
}

function countActiveFilters(filters: TransactionFilters): number {
  return [
    filters.startDate,
    filters.endDate,
    filters.categoryId,
    filters.type,
    filters.status,
    filters.sort !== DEFAULT_FILTERS.sort ? filters.sort : undefined,
  ].filter(Boolean).length;
}

function uniqueTransactions(pages: { items: Transaction[] }[] | undefined) {
  const transactions = new Map<string, Transaction>();
  pages?.forEach((page) => {
    page.items.forEach((transaction) => transactions.set(transaction.id, transaction));
  });
  return [...transactions.values()];
}

export function TransactionsScreen({
  initialFilter,
  onAddTransaction = () => undefined,
  onTransactionPress = () => undefined,
}: TransactionsScreenProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const [filters, setFilters] = useState<TransactionFilters>(() =>
    createInitialFilters(initialFilter),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const nextPageLock = useRef(false);

  useEffect(() => {
    setFilters(createInitialFilters(initialFilter));
  }, [initialFilter]);

  const query = useTransactionsInfiniteQuery(filters);
  const categoriesQuery = useTransactionCategoriesQuery();
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = query;
  const transactions = useMemo(
    () => uniqueTransactions(query.data?.pages),
    [query.data?.pages],
  );
  const activeFilterCount = countActiveFilters(filters);

  const loadNextPage = useCallback(async () => {
    if (
      nextPageLock.current ||
      !hasNextPage ||
      isFetchingNextPage ||
      isRefetching
    ) {
      return;
    }

    nextPageLock.current = true;
    try {
      await fetchNextPage();
    } finally {
      nextPageLock.current = false;
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  ]);

  const refresh = useCallback(() => {
    if (!isRefetching && !isFetchingNextPage) {
      void refetch();
    }
  }, [isFetchingNextPage, isRefetching, refetch]);

  const openTransaction = useCallback(
    (transaction: Transaction) => onTransactionPress(transaction.id),
    [onTransactionPress],
  );

  const renderTransaction = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionListItem onPress={openTransaction} transaction={item} />
    ),
    [openTransaction],
  );

  const header = (
    <>
      <MobileAppHeader greeting="Transações" />
      <View className="flex-row items-start justify-between gap-4 pb-4 pt-6">
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="text-2xl font-bold text-bytebank-text dark:text-bytebank-dark-text"
          >
            Seu extrato
          </Text>
          <Text className="mt-1 text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
            Movimentações mais recentes da conta.
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Adicionar transação"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-full bg-bytebank-primary active:bg-bytebank-primary-strong dark:bg-bytebank-dark-primary"
          onPress={onAddTransaction}
        >
          <Plus aria-hidden color="#ffffff" size={23} />
        </Pressable>
      </View>

      <View className="mb-4 flex-row items-center gap-3">
        <Pressable
          accessibilityHint="Abre as opções de data, categoria, tipo, status e ordenação"
          accessibilityLabel={
            activeFilterCount > 0
              ? `Filtros, ${activeFilterCount} ativos`
              : "Filtros"
          }
          accessibilityRole="button"
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-card border border-bytebank-border bg-bytebank-surface px-4 active:opacity-70 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
          onPress={() => setFiltersOpen(true)}
        >
          <Filter aria-hidden color={palette.primary} size={19} />
          <Text className="font-bold text-bytebank-text dark:text-bytebank-dark-text">
            Filtros
          </Text>
          {activeFilterCount > 0 ? (
            <View className="min-w-6 items-center rounded-full bg-bytebank-primary px-2 py-0.5 dark:bg-bytebank-dark-primary">
              <Text className="text-xs font-bold text-white dark:text-bytebank-dark-background">
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        {activeFilterCount > 0 ? (
          <Pressable
            accessibilityLabel="Limpar filtros"
            accessibilityRole="button"
            className="min-h-12 justify-center px-2"
            onPress={() => setFilters(DEFAULT_FILTERS)}
          >
            <Text className="font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
              Limpar
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text
        accessibilityLiveRegion="polite"
        className="mb-3 text-sm font-semibold text-bytebank-muted dark:text-bytebank-dark-muted"
      >
        {transactions.length} {transactions.length === 1 ? "movimentação" : "movimentações"}
      </Text>
    </>
  );

  if (query.isPending) {
    return (
      <ScreenContainer scroll={false}>
        {header}
        <TransactionsListSkeleton />
        <TransactionsFilterModal
          categories={categoriesQuery.data ?? []}
          filters={filters}
          onApply={setFilters}
          onClose={() => setFiltersOpen(false)}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          visible={filtersOpen}
        />
      </ScreenContainer>
    );
  }

  if (query.isError && transactions.length === 0) {
    return (
      <ScreenContainer scroll={false}>
        {header}
        <QueryState
          kind="error"
          message="Não foi possível carregar suas transações. Verifique sua conexão e tente novamente."
          onRetry={() => void query.refetch()}
        />
        <TransactionsFilterModal
          categories={categoriesQuery.data ?? []}
          filters={filters}
          onApply={setFilters}
          onClose={() => setFiltersOpen(false)}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          visible={filtersOpen}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        accessibilityLabel="Lista de transações"
        className="flex-1"
        contentContainerClassName="grow pb-10"
        data={transactions}
        initialNumToRender={10}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={10}
        ListEmptyComponent={
          <QueryState
            kind="empty"
            message={
              activeFilterCount > 0
                ? "Nenhuma transação corresponde aos filtros selecionados."
                : "Você ainda não possui transações."
            }
          />
        }
        ListFooterComponent={
          query.isFetchNextPageError ? (
            <View className="items-center py-5">
              <Text className="text-center text-sm text-bytebank-danger dark:text-bytebank-dark-danger">
                Não foi possível carregar mais transações.
              </Text>
              <Pressable
                accessibilityLabel="Tentar carregar próxima página novamente"
                accessibilityRole="button"
                className="mt-2 min-h-11 justify-center px-4"
                onPress={() => void loadNextPage()}
              >
                <Text className="font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
                  Tentar novamente
                </Text>
              </Pressable>
            </View>
          ) : query.isFetchingNextPage ? (
            <View
              accessibilityLabel="Carregando mais transações"
              accessibilityRole="progressbar"
              className="items-center py-6"
            >
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : (
            <View className="h-4" />
          )
        }
        ListHeaderComponent={header}
        onEndReached={() => void loadNextPage()}
        onEndReachedThreshold={0.35}
        removeClippedSubviews={Platform.OS !== "web"}
        refreshControl={
          <RefreshControl
            accessibilityLabel="Atualizar transações"
            onRefresh={refresh}
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            tintColor={palette.primary}
          />
        }
        renderItem={renderTransaction}
        showsVerticalScrollIndicator={false}
        testID="transactions-list"
        updateCellsBatchingPeriod={50}
        windowSize={7}
      />

      <TransactionsFilterModal
        categories={categoriesQuery.data ?? []}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFiltersOpen(false)}
        onClear={() => setFilters(DEFAULT_FILTERS)}
        visible={filtersOpen}
      />
    </ScreenContainer>
  );
}
