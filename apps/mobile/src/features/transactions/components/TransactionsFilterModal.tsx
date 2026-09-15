import { isValidCalendarDate } from "@banking/shared/domain";
import type {
  TransactionCategory,
  TransactionSort,
  TransactionStatus,
  TransactionType,
} from "@banking/shared/types";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, darkColors } from "@banking/shared/design-tokens";
import type { TransactionFilters } from "@mobile/features/transactions/types/transactions";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface TransactionsFilterModalProps {
  categories: TransactionCategory[];
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onClear: () => void;
  onClose: () => void;
  visible: boolean;
}

interface FilterOption<T extends string> {
  label: string;
  value?: T;
}

interface FilterOptionGroupProps<T extends string> {
  label: string;
  options: FilterOption<T>[];
  selected?: T;
  onSelect: (value?: T) => void;
}

function FilterOptionGroup<T extends string>({
  label,
  onSelect,
  options,
  selected,
}: FilterOptionGroupProps<T>) {
  return (
    <View className="mt-5">
      <Text className="mb-2 text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
        {label}
      </Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              className={
                active
                  ? "min-h-11 justify-center rounded-full bg-bytebank-primary px-4 dark:bg-bytebank-dark-primary"
                  : "min-h-11 justify-center rounded-full border border-bytebank-border bg-bytebank-elevated px-4 dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated"
              }
              key={option.value ?? "all"}
              onPress={() => onSelect(option.value)}
            >
              <Text
                className={
                  active
                    ? "text-sm font-bold text-white dark:text-bytebank-dark-background"
                    : "text-sm font-semibold text-bytebank-muted dark:text-bytebank-dark-muted"
                }
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const typeOptions: FilterOption<TransactionType>[] = [
  { label: "Todos" },
  { label: "Entradas", value: "income" },
  { label: "Saídas", value: "expense" },
];

const statusOptions: FilterOption<TransactionStatus>[] = [
  { label: "Todos" },
  { label: "Concluídas", value: "completed" },
  { label: "Pendentes", value: "pending" },
  { label: "Com falha", value: "failed" },
];

const sortOptions: FilterOption<TransactionSort>[] = [
  { label: "Mais recentes", value: "date-desc" },
  { label: "Mais antigas", value: "date-asc" },
  { label: "Maior valor", value: "amount-desc" },
  { label: "Menor valor", value: "amount-asc" },
  { label: "Descrição A–Z", value: "description-asc" },
  { label: "Descrição Z–A", value: "description-desc" },
];

export function TransactionsFilterModal({
  categories,
  filters,
  onApply,
  onClear,
  onClose,
  visible,
}: TransactionsFilterModalProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const [draft, setDraft] = useState<TransactionFilters>(filters);
  const [dateError, setDateError] = useState<string>();

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setDateError(undefined);
    }
  }, [filters, visible]);

  const applyFilters = () => {
    const startDate = draft.startDate?.trim() || undefined;
    const endDate = draft.endDate?.trim() || undefined;

    if (
      (startDate && !isValidCalendarDate(startDate)) ||
      (endDate && !isValidCalendarDate(endDate))
    ) {
      setDateError("Informe as datas no formato AAAA-MM-DD.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setDateError("A data inicial deve ser anterior ou igual à data final.");
      return;
    }
    if (
      (startDate || endDate) &&
      draft.sort !== undefined &&
      !draft.sort.startsWith("date-")
    ) {
      setDateError("Para filtrar por período, selecione uma ordenação por data.");
      return;
    }

    onApply({
      ...draft,
      startDate,
      endDate,
      pageSize: 20,
      sort: draft.sort ?? "date-desc",
    });
    onClose();
  };

  const clearFilters = () => {
    setDraft({ pageSize: 20, sort: "date-desc" });
    setDateError(undefined);
    onClear();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
    >
      <SafeAreaView
        className={`${isDark ? "dark" : ""} flex-1`}
        edges={["top", "right", "bottom", "left"]}
      >
        <View className="flex-1 bg-bytebank-background dark:bg-bytebank-dark-background">
        <View className="flex-row items-center justify-between border-b border-bytebank-border px-5 py-4 dark:border-bytebank-dark-border">
          <Text
            accessibilityRole="header"
            className="text-xl font-bold text-bytebank-text dark:text-bytebank-dark-text"
          >
            Filtrar transações
          </Text>
          <Pressable
            accessibilityLabel="Fechar filtros"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-bytebank-surface dark:bg-bytebank-dark-surface"
            onPress={onClose}
          >
            <X aria-hidden color={palette.text} size={22} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
                Data inicial
              </Text>
              <TextInput
                accessibilityLabel="Data inicial"
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-12 rounded-card border border-bytebank-border bg-bytebank-elevated px-3 text-bytebank-text dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated dark:text-bytebank-dark-text"
                onChangeText={(startDate) => {
                  setDraft((current) => ({ ...current, startDate }));
                  setDateError(undefined);
                }}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={palette.muted}
                value={draft.startDate ?? ""}
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
                Data final
              </Text>
              <TextInput
                accessibilityLabel="Data final"
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-12 rounded-card border border-bytebank-border bg-bytebank-elevated px-3 text-bytebank-text dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated dark:text-bytebank-dark-text"
                onChangeText={(endDate) => {
                  setDraft((current) => ({ ...current, endDate }));
                  setDateError(undefined);
                }}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={palette.muted}
                value={draft.endDate ?? ""}
              />
            </View>
          </View>
          {dateError ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              className="mt-2 text-sm text-bytebank-danger dark:text-bytebank-dark-danger"
            >
              {dateError}
            </Text>
          ) : null}

          <FilterOptionGroup
            label="Tipo"
            onSelect={(type) => setDraft((current) => ({ ...current, type }))}
            options={typeOptions}
            selected={draft.type}
          />
          <FilterOptionGroup
            label="Status"
            onSelect={(status) =>
              setDraft((current) => ({ ...current, status }))
            }
            options={statusOptions}
            selected={draft.status}
          />
          {categories.length > 0 ? (
            <FilterOptionGroup
              label="Categoria"
              onSelect={(categoryId) =>
                setDraft((current) => ({ ...current, categoryId }))
              }
              options={[
                { label: "Todas" },
                ...categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                })),
              ]}
              selected={draft.categoryId}
            />
          ) : (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
                Categoria
              </Text>
              <Text className="text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
                Nenhuma categoria cadastrada.
              </Text>
            </View>
          )}
          <FilterOptionGroup
            label="Ordenação"
            onSelect={(sort) =>
              setDraft((current) => ({ ...current, sort: sort ?? "date-desc" }))
            }
            options={sortOptions}
            selected={draft.sort ?? "date-desc"}
          />
        </ScrollView>

        <View className="flex-row gap-3 border-t border-bytebank-border px-5 py-4 dark:border-bytebank-dark-border">
          <Pressable
            accessibilityLabel="Limpar todos os filtros"
            accessibilityRole="button"
            className="min-h-12 flex-1 items-center justify-center rounded-card border border-bytebank-border dark:border-bytebank-dark-border"
            onPress={clearFilters}
          >
            <Text className="font-bold text-bytebank-text dark:text-bytebank-dark-text">
              Limpar
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Aplicar filtros"
            accessibilityRole="button"
            className="min-h-12 flex-1 items-center justify-center rounded-card bg-bytebank-primary dark:bg-bytebank-dark-primary"
            onPress={applyFilters}
          >
            <Text className="font-bold text-white dark:text-bytebank-dark-background">
              Aplicar filtros
            </Text>
          </Pressable>
        </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
