export type TransactionType = "income" | "expense";
export type TransactionStatus = "completed" | "pending" | "failed";
export type TransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description-asc" | "description-desc";
export type TransactionCategoryName = string;
/** Raw persistence shape. Timestamp values are supplied by the data adapter. */
export interface TransactionDocument<TTimestamp = unknown> {
    description: string;
    observation: string;
    amountInCents: number;
    type: TransactionType;
    categoryId: string;
    categoryName: TransactionCategoryName;
    occurredOn: string;
    status: TransactionStatus;
    attachmentCount: number;
    createdAt: TTimestamp;
    updatedAt: TTimestamp;
    schemaVersion: 1;
}
/** Platform-neutral domain model. Monetary values are always integer cents. */
export interface Transaction {
    id: string;
    description: string;
    observation: string;
    amountInCents: number;
    type: TransactionType;
    categoryId: string;
    category: TransactionCategoryName;
    date: string;
    status: TransactionStatus;
    attachmentCount: number;
}
/** Presentation contract consumed by the existing web application. */
export interface TransactionViewModel {
    id: string;
    description: string;
    observation: string;
    attachmentCount: number;
    amount: number;
    formattedAmount: string;
    type: TransactionType;
    typeLabel: string;
    category: TransactionCategoryName;
    date: string;
    formattedDate: string;
    status: TransactionStatus;
    statusLabel: string;
    editableFields: TransactionEditableFields;
}
export interface TransactionEditableFields {
    description: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategoryName;
    date: string;
    status: TransactionStatus;
    observation: string;
}
export interface TransactionListFilters {
    search?: string;
    type?: TransactionType;
    category?: string;
    status?: TransactionStatus;
    startDate?: string;
    endDate?: string;
    minimumAmount?: number;
    maximumAmount?: number;
    sort?: TransactionSort;
    page?: number;
    pageSize?: number;
    limit?: number;
}
export interface TransactionListResponse {
    items: TransactionViewModel[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    firstPage: number;
    previousPage: number | null;
    nextPage: number | null;
    lastPage: number;
    resultsLabel: string;
}
/** REST input kept in major units for compatibility with the existing web UI. */
export interface CreateTransactionRequest {
    description: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategoryName;
    date: string;
    status: TransactionStatus;
    observation?: string;
}
export type UpdateTransactionRequest = CreateTransactionRequest;
