export const MINIMUM_TRANSACTION_AMOUNT_IN_CENTS = 1;
export const MAXIMUM_TRANSACTION_AMOUNT_IN_CENTS = 99_999_999_999;

/**
 * Converts a user-entered BRL value to a number in major units.
 * Both decimal comma (preferred) and decimal point are accepted.
 */
export function parseCurrencyAmount(value: string): number {
  const compactValue = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");

  if (!compactValue) return Number.NaN;

  const hasDecimalComma = compactValue.includes(",");
  const normalizedValue = hasDecimalComma
    ? compactValue.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(?:\.\d{3})+$/.test(compactValue)
      ? compactValue.replace(/\./g, "")
      : compactValue;

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    return Number.NaN;
  }

  return Number(normalizedValue);
}

export function toAmountInCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new TypeError("O valor monetário deve ser finito.");
  }

  const direction = Math.sign(amount) || 1;
  const amountInCents = direction * Math.round((Math.abs(amount) + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(amountInCents)) {
    throw new RangeError("O valor monetário excede o limite seguro.");
  }

  return amountInCents;
}

export function fromAmountInCents(amountInCents: number): number {
  assertAmountInCents(amountInCents);
  return amountInCents / 100;
}

export function formatCurrencyFromCents(
  amountInCents: number,
  locale = "pt-BR",
  currency = "BRL",
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    fromAmountInCents(amountInCents),
  );
}

export function assertAmountInCents(amountInCents: number): void {
  if (!Number.isSafeInteger(amountInCents)) {
    throw new TypeError("amountInCents deve ser um inteiro seguro.");
  }
}
