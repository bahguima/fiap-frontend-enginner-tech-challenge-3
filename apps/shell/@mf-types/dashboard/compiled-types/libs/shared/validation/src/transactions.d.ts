import { z } from "zod";
import type { Transaction, TransactionEditableFields } from "@banking/shared/types";
import { MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS, MINIMUM_TRANSACTION_AMOUNT_IN_CENTS } from "@banking/shared/domain";
export { MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS, MINIMUM_TRANSACTION_AMOUNT_IN_CENTS, };
export declare const TRANSACTION_OBSERVATION_MAX_LENGTH = 500;
export declare function createTransactionFormSchema(maximumDate: string): z.ZodEffects<z.ZodObject<{
    description: z.ZodString;
    amount: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodEnum<["income", "expense"]>;
    categoryId: z.ZodString;
    date: z.ZodEffects<z.ZodString, string, string>;
    status: z.ZodEnum<["completed", "pending", "failed"]>;
    observation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "income" | "expense";
    date: string;
    status: "completed" | "pending" | "failed";
    description: string;
    amount: string;
    categoryId: string;
    observation: string;
}, {
    type: "income" | "expense";
    date: string;
    status: "completed" | "pending" | "failed";
    description: string;
    amount: string;
    categoryId: string;
    observation: string;
}>, {
    amountInCents: number;
    type: "income" | "expense";
    date: string;
    status: "completed" | "pending" | "failed";
    description: string;
    categoryId: string;
    observation: string;
}, {
    type: "income" | "expense";
    date: string;
    status: "completed" | "pending" | "failed";
    description: string;
    amount: string;
    categoryId: string;
    observation: string;
}>;
export type TransactionFormValues = z.input<ReturnType<typeof createTransactionFormSchema>>;
export type ParsedTransactionFormValues = z.output<ReturnType<typeof createTransactionFormSchema>>;
export declare function createTransactionSchema(maximumDate: string): z.ZodType<Transaction>;
export declare function createTransactionEditableFieldsSchema(maximumDate: string): z.ZodType<TransactionEditableFields>;
