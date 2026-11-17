import type {
  TransactionCategory,
  TransactionListFilters,
  TransactionSort,
  TransactionType,
} from "@banking/shared/types";

export interface ITransactionFiltersProps {
  "data-testid"?: string;
  categories: TransactionCategory[];
  filters: TransactionListFilters;
  isCategoriesError?: boolean;
  isCategoriesLoading?: boolean;
  isDisabled?: boolean;
  /** Valores brutos a cada alteração de campo (ainda não estabilizados). */
  onChange?: (filters: TransactionListFilters) => void;
  onClear: () => void;
  onSubmit: (filters: TransactionListFilters) => void;
}

export interface ITransactionFilterFormValues {
  search: string;
  type: TransactionType | "";
  category: string;
  startDate: string;
  endDate: string;
  minimumAmount: number | undefined;
  maximumAmount: number | undefined;
  sort: TransactionSort;
  pageSize: number;
}
