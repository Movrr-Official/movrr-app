import { formatDistanceToNowStrict, format } from "date-fns";

export function formatCurrency(value: number, currency = "EUR", locale = "nl-NL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number, locale = "nl-NL") {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return format(date, "dd MMM yyyy, HH:mm");
}

export function formatRelativeDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}
