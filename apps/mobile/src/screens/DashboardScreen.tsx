import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { AnimatedSection } from "@mobile/components/dashboard/AnimatedSection";
import { CategoryDistributionCard } from "@mobile/components/dashboard/CategoryDistributionCard";
import { FinancialFlowCard } from "@mobile/components/dashboard/FinancialFlowCard";
import { FinancialMetricsSection } from "@mobile/components/dashboard/FinancialMetricsSection";
import { QuickActionButton } from "@mobile/components/dashboard/QuickActionButton";
import { RecentTransactionsList } from "@mobile/components/dashboard/RecentTransactionsList";
import { MobileAppHeader } from "@mobile/components/layout/MobileAppHeader";
import { ScreenContainer } from "@mobile/components/layout/ScreenContainer";
import { QueryState } from "@mobile/components/states/QueryState";
import { useDashboard } from "@mobile/features/dashboard/hooks/useDashboard";
import { useAuth } from "@mobile/providers/AuthContext";

interface DashboardScreenProps {
  onAddTransaction?: () => void;
  onShowIncome?: () => void;
  onShowExpenses?: () => void;
  onShowAllTransactions?: () => void;
}

export function DashboardScreen({
  onAddTransaction = () => undefined,
  onShowIncome = () => undefined,
  onShowExpenses = () => undefined,
  onShowAllTransactions = () => undefined,
}: DashboardScreenProps) {
  const { session } = useAuth();
  const dashboard = useDashboard();
  const firstName = session?.displayName?.trim().split(/\s+/)[0] || "Cliente";
  const state = dashboard.isPending
    ? "loading"
    : dashboard.isError
      ? "error"
      : dashboard.summary.data?.transactionCount === 0
        ? "empty"
        : "success";

  const content = (() => {
    if (state === "loading") {
      return (
        <AnimatedSection transitionKey="loading">
          <QueryState kind="loading" message="Carregando seus indicadores financeiros..." />
        </AnimatedSection>
      );
    }
    if (state === "error") {
      return (
        <AnimatedSection transitionKey="error">
          <QueryState
            kind="error"
            message="Não foi possível carregar o dashboard. Verifique sua conexão e tente novamente."
            onRetry={() => void dashboard.refetch()}
          />
        </AnimatedSection>
      );
    }
    if (state === "empty") {
      return (
        <AnimatedSection transitionKey="empty">
          <QueryState
            kind="empty"
            message="Registre sua primeira transação concluída para acompanhar saldo, entradas, saídas e gráficos deste período."
            title="Ainda não há dados financeiros"
          />
        </AnimatedSection>
      );
    }

    const indicators = dashboard.summary.data;
    const monthly = dashboard.monthly.data;
    const categories = dashboard.categories.data;
    const recent = dashboard.recent.data;
    if (!indicators || !monthly || !categories || !recent) return null;

    return (
      <View className="gap-5">
        <AnimatedSection transitionKey={dashboard.period.key}>
          <View
            accessible
            accessibilityLabel={`Período analisado: ${dashboard.period.label}. ${indicators.transactionCount} transações concluídas.`}
            className="self-start rounded-full border border-bytebank-border bg-bytebank-surface px-4 py-2 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
          >
            <Text className="text-xs font-semibold text-bytebank-muted dark:text-bytebank-dark-muted">
              {dashboard.period.label} · {indicators.transactionCount} concluídas
            </Text>
          </View>
        </AnimatedSection>

        <AnimatedSection delay={60} transitionKey={indicators.balance.valueInCents}>
          <FinancialMetricsSection
            balance={indicators.balance}
            totalExpense={indicators.totalExpense}
            totalIncome={indicators.totalIncome}
          />
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <View>
            <Text
              accessibilityRole="header"
              className="mb-3 text-base font-bold text-bytebank-text dark:text-bytebank-dark-text"
            >
              Ações rápidas
            </Text>
            <View className="flex-row gap-2.5">
              <QuickActionButton icon={ArrowDownLeft} label="Ver entradas" onPress={onShowIncome} />
              <QuickActionButton prominent icon={Plus} label="Adicionar" onPress={onAddTransaction} />
              <QuickActionButton icon={ArrowUpRight} label="Ver saídas" onPress={onShowExpenses} />
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection delay={140} transitionKey={dashboard.period.key}>
          <FinancialFlowCard data={monthly} />
        </AnimatedSection>
        <AnimatedSection delay={180} transitionKey={dashboard.period.key}>
          <CategoryDistributionCard data={categories} periodLabel={dashboard.period.label} />
        </AnimatedSection>
        <AnimatedSection delay={220} transitionKey={recent.map((item) => item.id).join("-")}>
          <RecentTransactionsList transactions={recent} />
        </AnimatedSection>

        <Pressable
          accessibilityLabel="Visualizar todas as transações"
          accessibilityRole="link"
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-card active:opacity-60"
          onPress={onShowAllTransactions}
        >
          <Text className="text-sm font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
            Visualizar todas as transações
          </Text>
          <ChevronRight aria-hidden color="#0e7f84" size={18} strokeWidth={2.4} />
        </Pressable>
      </View>
    );
  })();

  return (
    <ScreenContainer scroll={false} testID="dashboard-screen">
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow pb-10"
        refreshControl={
          <RefreshControl
            accessibilityLabel="Atualizar dashboard"
            onRefresh={() => void dashboard.refetch()}
            refreshing={dashboard.isRefetching}
            testID="dashboard-refresh-control"
            tintColor="#0e7f84"
          />
        }
        showsVerticalScrollIndicator={false}
        testID="dashboard-scroll"
      >
        <MobileAppHeader greeting={`Olá, ${firstName}`} />
        <View className="pb-4 pt-6">
          <Text
            accessibilityRole="header"
            className="text-2xl font-bold tracking-tight text-bytebank-text dark:text-bytebank-dark-text"
          >
            Visão financeira
          </Text>
          <Text className="mt-1 text-sm leading-5 text-bytebank-muted dark:text-bytebank-dark-muted">
            Acompanhe os principais indicadores da sua conta.
          </Text>
        </View>
        {content}
      </ScrollView>
    </ScreenContainer>
  );
}
