import { isCalendarDateOnOrBefore, isValidCalendarDate } from "@banking/shared/domain";

describe("validação de data", () => {
  it("aceita datas civis válidas sem conversão de fuso", () => {
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDateOnOrBefore("2026-09-13", "2026-09-13")).toBe(true);
  });

  it("rejeita datas inexistentes, fora do formato e futuras", () => {
    expect(isValidCalendarDate("2025-02-29")).toBe(false);
    expect(isValidCalendarDate("13/09/2026")).toBe(false);
    expect(isCalendarDateOnOrBefore("2026-09-14", "2026-09-13")).toBe(false);
  });
});
