import type { TransactionCategory } from "@banking/shared/types";

export const mockCategories: TransactionCategory[] = [
  { id: "category-1", name: "Depósito", type: "income" },
  { id: "category-2", name: "Transferência", type: "both" },
  { id: "category-3", name: "Pagamento", type: "expense" },
  { id: "category-4", name: "Saque", type: "expense" },
  { id: "category-5", name: "Investimento", type: "both" },
  { id: "category-6", name: "Outro", type: "both" },
];

/** Revisão do catálogo; incremente ao alterar `mockCategories` (gera novo ETag). */
export const mockCategoriesRevision = 1;
