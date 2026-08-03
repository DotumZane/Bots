import { describe, expect, it } from "vitest";
import { parsePrice, detectCurrency } from "../../lib/price";
import { normalizeAvailability } from "../../lib/availability";
import { analyzeHtml } from "../../lib/detection";
import { isPrivateAddress } from "../../lib/security";
import { renderTemplate } from "../../lib/notifications";
import { detectChanges } from "../../lib/change-detection";
import { Availability } from "@prisma/client";
import { botSchema } from "../../lib/validation";

describe("price parsing", () => {
  it("normalizes common formats into minor units", () => { expect(parsePrice("$12.99")).toBe(1299); expect(parsePrice("$1,299.00")).toBe(129900); expect(parsePrice("€ 1.299,95", "EUR")).toBe(129995); });
  it("detects currency", () => expect(detectCurrency("Only £19.95")).toBe("GBP"));
});
describe("availability", () => { it("normalizes schema values", () => { expect(normalizeAvailability("https://schema.org/InStock")).toBe("IN_STOCK"); expect(normalizeAvailability("SoldOut")).toBe("OUT_OF_STOCK"); expect(normalizeAvailability("PreOrder")).toBe("PREORDER"); }); });
describe("structured extraction", () => { it("extracts a JSON-LD product", () => { const result = analyzeHtml(`<script type="application/ld+json">{"@type":"Product","name":"Drill","image":"https://e.test/a.jpg","offers":{"@type":"Offer","price":"99.00","priceCurrency":"USD","availability":"https://schema.org/InStock"}}</script>`, "https://e.test/p"); expect(result).toMatchObject({ title: "Drill", priceMinor: 9900, availability: "IN_STOCK", detectionMethod: "JSON_LD" }); }); });
describe("SSRF guard", () => { it("blocks private ranges", () => { ["127.0.0.1","10.0.0.1","172.16.1.1","192.168.1.1","169.254.1.1","::1"].forEach((ip) => expect(isPrivateAddress(ip)).toBe(true)); expect(isPrivateAddress("8.8.8.8")).toBe(false); }); });
describe("templates", () => { it("renders known variables", () => expect(renderTemplate("{{productName}} is {{availability}}", { productName: "Drill", availability: "available" })).toBe("Drill is available")); });
describe("change alerts", () => {
  const rules = { notifyOnPriceDrop: true, notifyOnTargetPrice: false, targetPriceMinor: null, notifyOnAvailable: true, notifyOnUnavailable: false, notifyOnPriceIncrease: false, notifyOnProductChange: true, minimumChangeMinor: 100, minimumChangePercent: 5 };
  it("honors amount and percentage thresholds", () => expect(detectChanges({ priceMinor: 10000, availability: Availability.IN_STOCK }, { priceMinor: 9000, availability: Availability.IN_STOCK }, rules).map((event) => event.type)).toContain("PRICE_DROP"));
  it("detects variant changes", () => expect(detectChanges({ priceMinor: 10000, availability: Availability.IN_STOCK, variantValue: "Black" }, { priceMinor: 10000, availability: Availability.IN_STOCK, variantValue: "White" }, rules).map((event) => event.type)).toContain("PRODUCT_CHANGED"));
});
describe("uptime monitors", () => {
  it("requires a port for TCP targets", () => {
    const result = botSchema.safeParse({
      name: "Server", url: "tcp://server.example.com", hostname: "server.example.com", monitorKind: "TCP",
      enabled: true, checkIntervalMinutes: 5, browserMode: false, notifyOnPriceDrop: false, notifyOnTargetPrice: false,
      notifyOnAvailable: false, notifyOnUnavailable: false, notifyOnPriceIncrease: false, minimumChangeMinor: 1,
      minimumChangePercent: 0, confirmationCount: 1, notificationCooldownMinutes: 60, pageLoadDelayMs: 0,
    });
    expect(result.success).toBe(false);
  });
  it("accepts an HTTP latency monitor", () => {
    const result = botSchema.safeParse({
      name: "Website", url: "https://example.com", hostname: "example.com", monitorKind: "HTTP",
      latencyThresholdMs: 750, enabled: true, checkIntervalMinutes: 1, browserMode: false, notifyOnPriceDrop: false,
      notifyOnTargetPrice: false, notifyOnAvailable: false, notifyOnUnavailable: false, notifyOnPriceIncrease: false,
      minimumChangeMinor: 1, minimumChangePercent: 0, confirmationCount: 1, notificationCooldownMinutes: 60, pageLoadDelayMs: 0,
    });
    expect(result.success).toBe(true);
  });
});
