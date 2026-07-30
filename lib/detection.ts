import * as cheerio from "cheerio";
import { Availability, DetectionMethod } from "@prisma/client";
import { normalizeAvailability } from "./availability";
import { detectCurrency, parsePrice } from "./price";
import type { DetectionResult } from "./types";

type JsonObject = Record<string, unknown>;
const asObject = (value: unknown): JsonObject | undefined => typeof value === "object" && value !== null ? value as JsonObject : undefined;
const firstString = (value: unknown): string | undefined => Array.isArray(value) ? firstString(value[0]) : typeof value === "string" ? value : asObject(value)?.url as string | undefined;

function findProducts(node: unknown, results: JsonObject[] = []): JsonObject[] {
  if (Array.isArray(node)) node.forEach((item) => findProducts(item, results));
  const object = asObject(node);
  if (!object) return results;
  const type = object["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) results.push(object);
  Object.values(object).forEach((value) => { if (typeof value === "object") findProducts(value, results); });
  return results;
}

export function analyzeHtml(html: string, pageUrl: string, selectors?: Record<string, string | undefined>): DetectionResult {
  const $ = cheerio.load(html);
  const hostname = new URL(pageUrl).hostname;
  const warnings: string[] = [];
  const prices: number[] = [];
  let result: DetectionResult = { availability: Availability.UNKNOWN, hostname, detectionMethod: DetectionMethod.HTML_TEXT, detectedPrices: prices, warnings };
  if (selectors?.variant) result.variantValue = $(selectors.variant).first().text().trim() || $(selectors.variant).first().attr("content") || undefined;

  if (selectors?.price) {
    const text = $(selectors.price).first().text();
    const currency = detectCurrency(text);
    result = { ...result, priceMinor: parsePrice(text, currency), currency, title: selectors.title ? $(selectors.title).first().text().trim() : undefined,
      imageUrl: selectors.image ? $(selectors.image).first().attr("src") : undefined, availability: selectors.availability ? normalizeAvailability($(selectors.availability).first().text()) : Availability.UNKNOWN,
      detectionMethod: DetectionMethod.CSS_SELECTOR };
  }

  if (result.priceMinor == null) {
    const scripts = $('script[type="application/ld+json"]').toArray();
    for (const script of scripts) {
      try {
        const products = findProducts(JSON.parse($(script).text()));
        const product = products[0];
        if (!product) continue;
        const offersRaw = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        const offers = asObject(offersRaw) ?? product;
        const currency = firstString(offers.priceCurrency) ?? "USD";
        const priceText = firstString(offers.price) ?? firstString(offers.lowPrice);
        result = { ...result, title: firstString(product.name), imageUrl: firstString(product.image), priceMinor: priceText ? parsePrice(priceText, currency) : undefined,
          regularPriceMinor: firstString(offers.highPrice) ? parsePrice(firstString(offers.highPrice)!, currency) : undefined,
          currency, availability: normalizeAvailability(firstString(offers.availability)), detectionMethod: DetectionMethod.JSON_LD };
        break;
      } catch { warnings.push("Invalid JSON-LD block ignored."); }
    }
  }

  if (result.priceMinor == null) {
    const priceText = $('meta[property="product:price:amount"]').attr("content") ?? $('meta[itemprop="price"]').attr("content") ?? $('[itemprop="price"]').first().attr("content");
    const currency = $('meta[property="product:price:currency"]').attr("content") ?? $('meta[itemprop="priceCurrency"]').attr("content") ?? "USD";
    if (priceText) result = { ...result, priceMinor: parsePrice(priceText, currency), currency, detectionMethod: DetectionMethod.META_TAG };
  }

  result.title ??= $('meta[property="og:title"]').attr("content") ?? ($("h1").first().text().trim() || undefined);
  result.imageUrl ??= $('meta[property="og:image"]').attr("content");
  if (result.availability === Availability.UNKNOWN) result.availability = normalizeAvailability($('meta[property="product:availability"]').attr("content") ?? $("body").text());

  const candidateTexts = $('[class*="price"], [id*="price"], [itemprop="price"]').toArray().slice(0, 30).map((node) => $(node).text().trim());
  for (const text of candidateTexts) {
    const parsed = parsePrice(text, result.currency);
    if (parsed != null && parsed > 0 && !prices.includes(parsed)) prices.push(parsed);
  }
  if (result.priceMinor == null && prices.length) {
    result.priceMinor = prices[0];
    result.currency = detectCurrency(candidateTexts[0]);
  }
  if (prices.length > 3) warnings.push("Multiple conflicting prices were found; verify the selected price.");
  if (result.priceMinor === 0) { result.priceMinor = undefined; warnings.push("A zero price was rejected as likely invalid."); }
  return result;
}
