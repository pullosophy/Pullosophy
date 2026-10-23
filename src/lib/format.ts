export function formatPrice(cents: number, locale = "it-IT", currency = "EUR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}
