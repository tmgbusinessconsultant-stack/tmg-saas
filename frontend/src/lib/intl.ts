export type SupportedLocale = "en" | "fr" | "es" | "ar";

export const DEFAULT_LOCALE: SupportedLocale = "en";

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(
  value: Date | string | number,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function formatNumber(value: number, locale = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}

export function getDirection(locale: string): "ltr" | "rtl" {
  return /^ar\b|^he\b|^fa\b|^ur\b/i.test(locale) ? "rtl" : "ltr";
}
