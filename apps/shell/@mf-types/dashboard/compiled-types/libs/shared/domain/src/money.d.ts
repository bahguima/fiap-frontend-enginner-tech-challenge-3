export declare const MINIMUM_TRANSACTION_AMOUNT_IN_CENTS = 1;
export declare const MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS = 99999999999;
/**
 * Converts a user-entered BRL value to a number in major units.
 * Both decimal comma (preferred) and decimal point are accepted.
 */
export declare function parseCurrencyAmount(value: string): number;
export declare function toAmountInCents(amount: number): number;
export declare function fromAmountInCents(amountInCents: number): number;
export declare function formatCurrencyFromCents(amountInCents: number, locale?: string, currency?: string): string;
export declare function assertAmountInCents(amountInCents: number): void;
