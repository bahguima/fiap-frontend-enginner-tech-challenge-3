import type { TransactionViewModel } from "@banking/shared/types";

export interface TransactionDetailsModalProps {
  "data-testid"?: string;
  open: boolean;
  transaction?: TransactionViewModel | null;
  onOpenChange: (open: boolean) => void;
}
