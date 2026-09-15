import type { TransactionViewModel } from "@banking/shared/types";
export interface TransactionTableProps {
    "data-testid"?: string;
    data: TransactionViewModel[];
    onView?: (transactionId: string) => void;
    onEdit?: (transactionId: string) => void;
    onDelete?: (transactionId: string) => void;
}
export interface TransactionActionsMenuProps extends Pick<TransactionTableProps, "onView" | "onEdit" | "onDelete"> {
    transaction: TransactionViewModel;
}
export interface StatusIconProps {
    status: TransactionViewModel["status"];
}
export type HeaderCellAlign = "left" | "right";
