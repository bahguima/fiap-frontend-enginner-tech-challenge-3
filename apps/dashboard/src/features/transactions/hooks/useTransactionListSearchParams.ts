"use client";

import { useEffect, useState } from "react";
import type {
  TransactionListFilters,
  TransactionSort,
  TransactionType,
} from "@banking/shared/types";

import type {
  ITransactionListUrlState,
  ITransactionSearchParamsValues,
} from "./interface";

export const DEFAULT_TRANSACTION_PAGE_SIZE = 10;
export const DEFAULT_TRANSACTION_SORT: TransactionSort = "date-desc";

export function useTransactionListSearchParams(): ITransactionListUrlState {
  const [search, setSearch] = useState(() => window.location.search);
  // Muda só quando os filtros vêm de fora do formulário (voltar/avançar,
  // limpar), sinalizando que o formulário não controlado deve ser recriado.
  const [formRevision, setFormRevision] = useState(0);
  const filters = readTransactionSearchParams(search);

  useEffect(() => {
    const handlePopState = () => {
      setSearch(window.location.search);
      setFormRevision((revision) => revision + 1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateUrl = (nextFilters: TransactionListFilters) => {
    const nextSearch = createTransactionSearchParams(nextFilters);
    // Evita entradas duplicadas no histórico (ex.: submit seguido do mesmo
    // valor estabilizado pelo stream de filtros).
    if (nextSearch === window.location.search) return;

    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;

    window.history.pushState(null, "", nextUrl);
    setSearch(nextSearch);
  };

  return {
    filters,
    formRevision,
    hasActiveFilters:
      filters.search !== undefined ||
      filters.type !== undefined ||
      filters.category !== undefined ||
      filters.startDate !== undefined ||
      filters.endDate !== undefined ||
      filters.minimumAmount !== undefined ||
      filters.maximumAmount !== undefined,
    applyFilters: (nextFilters) =>
      updateUrl({
        ...nextFilters,
        page: 1,
      }),
    clearFilters: () => {
      updateUrl({});
      setFormRevision((revision) => revision + 1);
    },
    goToPage: (page) =>
      updateUrl({
        ...filters,
        page,
      }),
  };
}

export function readTransactionSearchParams(
  search: string,
): TransactionListFilters {
  const searchParams = new URLSearchParams(search);
  const type = searchParams.get("type");
  const sort = searchParams.get("sort");

  return {
    search: readText(searchParams.get("search")),
    type: readTransactionType(type),
    category: readText(searchParams.get("category")),
    startDate: readText(searchParams.get("startDate")),
    endDate: readText(searchParams.get("endDate")),
    minimumAmount: readNonNegativeNumber(
      searchParams.get("minimumAmount"),
    ),
    maximumAmount: readNonNegativeNumber(
      searchParams.get("maximumAmount"),
    ),
    sort: readTransactionSort(sort) ?? DEFAULT_TRANSACTION_SORT,
    page: readPositiveInteger(searchParams.get("page")) ?? 1,
    pageSize:
      readPageSize(searchParams.get("pageSize")) ??
      DEFAULT_TRANSACTION_PAGE_SIZE,
  };
}

export function createTransactionSearchParams(
  filters: TransactionListFilters,
) {
  const values: ITransactionSearchParamsValues = {
    search: filters.search,
    type: filters.type,
    category: filters.category,
    startDate: filters.startDate,
    endDate: filters.endDate,
    minimumAmount: filters.minimumAmount,
    maximumAmount: filters.maximumAmount,
    sort: filters.sort ?? DEFAULT_TRANSACTION_SORT,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? DEFAULT_TRANSACTION_PAGE_SIZE,
  };
  const searchParams = new URLSearchParams();

  setTextSearchParam(searchParams, "search", values.search);
  setTextSearchParam(searchParams, "type", values.type);
  setTextSearchParam(searchParams, "category", values.category);
  setTextSearchParam(searchParams, "startDate", values.startDate);
  setTextSearchParam(searchParams, "endDate", values.endDate);
  setNumberSearchParam(
    searchParams,
    "minimumAmount",
    values.minimumAmount,
  );
  setNumberSearchParam(
    searchParams,
    "maximumAmount",
    values.maximumAmount,
  );

  if (values.sort !== DEFAULT_TRANSACTION_SORT) {
    searchParams.set("sort", values.sort);
  }

  if (values.page > 1) {
    searchParams.set("page", `${values.page}`);
  }

  if (values.pageSize !== DEFAULT_TRANSACTION_PAGE_SIZE) {
    searchParams.set("pageSize", `${values.pageSize}`);
  }

  const nextSearch = searchParams.toString();
  return nextSearch ? `?${nextSearch}` : "";
}

function setTextSearchParam(
  searchParams: URLSearchParams,
  name: string,
  value?: string,
) {
  const normalizedValue = value?.trim();
  if (normalizedValue) searchParams.set(name, normalizedValue);
}

function setNumberSearchParam(
  searchParams: URLSearchParams,
  name: string,
  value?: number,
) {
  if (value !== undefined) searchParams.set(name, `${value}`);
}

function readText(value: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

function readTransactionType(value: string | null): TransactionType | undefined {
  if (value === "income" || value === "expense") return value;
  return undefined;
}

function readTransactionSort(value: string | null): TransactionSort | undefined {
  if (
    value === "date-desc" ||
    value === "date-asc" ||
    value === "amount-desc" ||
    value === "amount-asc" ||
    value === "description-asc" ||
    value === "description-desc"
  ) {
    return value;
  }

  return undefined;
}

function readPositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsedValue = parseInt(value, 10);
  return parsedValue > 0 ? parsedValue : undefined;
}

function readPageSize(value: string | null) {
  const pageSize = readPositiveInteger(value);
  if (pageSize === 5 || pageSize === 10 || pageSize === 20 || pageSize === 50) {
    return pageSize;
  }
  return undefined;
}

function readNonNegativeNumber(value: string | null) {
  if (!value || !/^\d+([.,]\d+)?$/.test(value)) return undefined;
  const parsedValue = parseFloat(value.replace(",", "."));
  return parsedValue >= 0 ? parsedValue : undefined;
}
