"use client";

import type { FormEvent } from "react";
import type {
  TransactionListFilters,
  TransactionSort,
  TransactionType,
} from "@banking/shared/types";
import { Button } from "@banking/shared/ui/components/button";
import { Input } from "@banking/shared/ui/components/input";

import type {
  ITransactionFilterFormValues,
  ITransactionFiltersProps,
} from "./interface";
import {
  Field,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  FilterActions,
  FiltersForm,
  FiltersGrid,
  FiltersTitle,
  NativeSelect,
  WideField,
} from "./styled";

export const TransactionFilters = ({
  "data-testid": dataTestId,
  categories,
  filters,
  isCategoriesError = false,
  isCategoriesLoading = false,
  isDisabled = false,
  onChange,
  onClear,
  onSubmit,
}: ITransactionFiltersProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(readFilters(event.currentTarget));
  };

  // Cada tecla/seleção vira um evento bruto; quem consome decide como
  // estabilizá-lo (ex.: stream com debounce no extrato).
  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    onChange?.(readFilters(event.currentTarget));
  };

  return (
    <FiltersForm
      aria-label="Filtros de transações"
      data-testid={dataTestId}
      onChange={handleChange}
      onSubmit={handleSubmit}
    >
      <FiltersTitle>Buscar e filtrar</FiltersTitle>
      <FiltersGrid>
        <WideField>
          <FieldLabel htmlFor="transaction-search">
            Buscar por texto
          </FieldLabel>
          <Input
            defaultValue={filters.search}
            disabled={isDisabled}
            id="transaction-search"
            name="search"
            placeholder="Descrição, categoria ou status"
            type="search"
          />
        </WideField>

        <Field>
          <FieldLabel htmlFor="transaction-type">Tipo</FieldLabel>
          <NativeSelect
            defaultValue={filters.type ?? ""}
            disabled={isDisabled}
            id="transaction-type"
            name="type"
          >
            <option value="">Todos os tipos</option>
            <option value="income">Entrada</option>
            <option value="expense">Saída</option>
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor="transaction-category">Categoria</FieldLabel>
          <NativeSelect
            // Recria só este select quando as opções chegam, para aplicar o
            // valor inicial sem descartar o que já foi digitado no formulário.
            key={isCategoriesLoading ? "categories-loading" : "categories-ready"}
            defaultValue={filters.category ?? ""}
            disabled={
              isDisabled || isCategoriesLoading || isCategoriesError
            }
            id="transaction-category"
            name="category"
          >
            <option value="">
              {isCategoriesLoading && "Carregando categorias..."}
              {isCategoriesError && "Categorias indisponíveis"}
              {!isCategoriesLoading &&
                !isCategoriesError &&
                "Todas as categorias"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Fieldset>
          <FieldsetLegend>Período</FieldsetLegend>
          <Field>
            <FieldLabel htmlFor="transaction-start-date">De</FieldLabel>
            <Input
              defaultValue={filters.startDate}
              disabled={isDisabled}
              id="transaction-start-date"
              name="startDate"
              type="date"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="transaction-end-date">Até</FieldLabel>
            <Input
              defaultValue={filters.endDate}
              disabled={isDisabled}
              id="transaction-end-date"
              name="endDate"
              type="date"
            />
          </Field>
        </Fieldset>

        <Fieldset>
          <FieldsetLegend>Faixa de valor</FieldsetLegend>
          <Field>
            <FieldLabel htmlFor="transaction-minimum-amount">
              Valor mínimo
            </FieldLabel>
            <Input
              defaultValue={filters.minimumAmount}
              disabled={isDisabled}
              id="transaction-minimum-amount"
              min="0"
              name="minimumAmount"
              step="0.01"
              type="number"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="transaction-maximum-amount">
              Valor máximo
            </FieldLabel>
            <Input
              defaultValue={filters.maximumAmount}
              disabled={isDisabled}
              id="transaction-maximum-amount"
              min="0"
              name="maximumAmount"
              step="0.01"
              type="number"
            />
          </Field>
        </Fieldset>

        <Field>
          <FieldLabel htmlFor="transaction-sort">Ordenar por</FieldLabel>
          <NativeSelect
            defaultValue={filters.sort ?? "date-desc"}
            disabled={isDisabled}
            id="transaction-sort"
            name="sort"
          >
            <option value="date-desc">Data mais recente</option>
            <option value="date-asc">Data mais antiga</option>
            <option value="amount-desc">Maior valor</option>
            <option value="amount-asc">Menor valor</option>
            <option value="description-asc">Descrição de A a Z</option>
            <option value="description-desc">Descrição de Z a A</option>
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor="transaction-page-size">
            Itens por página
          </FieldLabel>
          <NativeSelect
            defaultValue={filters.pageSize ?? 10}
            disabled={isDisabled}
            id="transaction-page-size"
            name="pageSize"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </NativeSelect>
        </Field>
      </FiltersGrid>

      <FilterActions>
        <Button
          disabled={isDisabled}
          onClick={onClear}
          type="button"
          variant="outline"
        >
          Limpar filtros
        </Button>
        <Button disabled={isDisabled} type="submit">
          Aplicar filtros
        </Button>
      </FilterActions>
    </FiltersForm>
  );
};

function readFilters(form: HTMLFormElement): TransactionListFilters {
  const values = readFormValues(form);

  return {
    search: values.search || undefined,
    type: values.type || undefined,
    category: values.category || undefined,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    minimumAmount: values.minimumAmount,
    maximumAmount: values.maximumAmount,
    sort: values.sort,
    pageSize: values.pageSize,
  };
}

function readFormValues(form: HTMLFormElement): ITransactionFilterFormValues {
  return {
    search: readTextValue(form, "search"),
    type: readTransactionType(form),
    category: readTextValue(form, "category"),
    startDate: readTextValue(form, "startDate"),
    endDate: readTextValue(form, "endDate"),
    minimumAmount: readOptionalNumber(form, "minimumAmount"),
    maximumAmount: readOptionalNumber(form, "maximumAmount"),
    sort: readTransactionSort(form),
    pageSize: readPageSize(form),
  };
}

function readTextValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
    return field.value.trim();
  }

  return "";
}

function readTransactionType(form: HTMLFormElement): TransactionType | "" {
  const value = readTextValue(form, "type");
  return value === "income" || value === "expense" ? value : "";
}

function readTransactionSort(form: HTMLFormElement): TransactionSort {
  const value = readTextValue(form, "sort");

  if (
    value === "date-asc" ||
    value === "amount-desc" ||
    value === "amount-asc" ||
    value === "description-asc" ||
    value === "description-desc"
  ) {
    return value;
  }

  return "date-desc";
}

function readOptionalNumber(form: HTMLFormElement, name: string) {
  const value = readTextValue(form, name);
  return value ? parseFloat(value) : undefined;
}

function readPageSize(form: HTMLFormElement) {
  const value = readTextValue(form, "pageSize");
  if (value === "5" || value === "20" || value === "50") {
    return parseInt(value, 10);
  }
  return 10;
}
