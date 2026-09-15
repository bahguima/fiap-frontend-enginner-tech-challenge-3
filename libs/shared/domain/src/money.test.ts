import { formatCurrencyFromCents, fromAmountInCents, toAmountInCents } from "./money";

describe("conversão monetária", () => {
  it("converte valores decimais em centavos sem persistir ponto flutuante", () => {
    expect(toAmountInCents(59.9)).toBe(5990);
    expect(toAmountInCents(0.1 + 0.2)).toBe(30);
    expect(toAmountInCents(-1.005)).toBe(-101);
    expect(fromAmountInCents(42743)).toBe(427.43);
  });

  it("rejeita centavos fracionários", () => {
    expect(() => fromAmountInCents(10.5)).toThrow("inteiro seguro");
  });

  it("formata diretamente a partir de centavos", () => {
    expect(formatCurrencyFromCents(12550)).toMatch(/^R\$\s125,50$/);
  });
});
