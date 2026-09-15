import type { TransactionViewModel } from "@banking/shared/types";

import type { TransactionFormValues } from "./schema";

export interface ITransactionFormModalProps {
  "data-testid"?: string;
  mode: "create" | "edit";
  open: boolean;
  transaction?: TransactionViewModel | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransactionFormValues) => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
}
