const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidCalendarDate(value: string): boolean {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isCalendarDateOnOrBefore(value: string, maximumDate: string): boolean {
  return isValidCalendarDate(value) && isValidCalendarDate(maximumDate) && value <= maximumDate;
}

export function formatCalendarDate(value: string, locale = "pt-BR"): string {
  if (!isValidCalendarDate(value)) {
    throw new RangeError("A data deve seguir o formato YYYY-MM-DD.");
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function getCalendarDateValue(date: Date): string {
  return [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
}
