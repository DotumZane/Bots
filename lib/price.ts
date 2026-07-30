const SYMBOL_CURRENCIES: Record<string, string> = {
  "$": "USD", "US$": "USD", "CA$": "CAD", "C$": "CAD", "A$": "AUD",
  "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR",
};

export function detectCurrency(value: string, fallback = "USD"): string {
  const code = value.toUpperCase().match(/\b(USD|CAD|AUD|EUR|GBP|JPY|INR|NZD|CHF|SEK|NOK|DKK)\b/)?.[1];
  if (code) return code;
  return Object.entries(SYMBOL_CURRENCIES).find(([symbol]) => value.includes(symbol))?.[1] ?? fallback;
}

export function parsePrice(value: string, currency = detectCurrency(value)): number | undefined {
  const match = value.replace(/\s/g, "").match(/(?:US|CA|A|C)?[$€£¥₹]?\s*(\d[\d.,]*)(?!\d)/);
  if (!match) return undefined;
  let numeric = match[1];
  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");
  if (lastComma > lastDot && numeric.length - lastComma - 1 <= 2) {
    numeric = numeric.replace(/\./g, "").replace(",", ".");
  } else {
    numeric = numeric.replace(/,/g, "");
  }
  const amount = Number(numeric);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  const zeroDecimal = ["JPY"].includes(currency);
  return Math.round(amount * (zeroDecimal ? 1 : 100));
}

export function formatPrice(minor?: number | null, currency = "USD"): string {
  if (minor == null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / (currency === "JPY" ? 1 : 100));
}
