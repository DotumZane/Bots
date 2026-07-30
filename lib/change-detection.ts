import { Availability, EventType } from "@prisma/client";
import type { ChangeEvent } from "./types";

type State = { priceMinor: number | null; availability: Availability; title?: string | null; variantValue?: string | null };
type Rules = { notifyOnPriceDrop: boolean; notifyOnTargetPrice: boolean; targetPriceMinor: number | null; notifyOnAvailable: boolean; notifyOnUnavailable: boolean; notifyOnPriceIncrease: boolean; notifyOnHistoricalLow?: boolean; notifyOnProductChange?: boolean; minimumChangeMinor: number; minimumChangePercent: number };

export function detectChanges(previous: State | null, current: State, rules: Rules): ChangeEvent[] {
  if (!previous) return [];
  const events: ChangeEvent[] = [];
  if (previous.priceMinor != null && current.priceMinor != null) {
    const delta = current.priceMinor - previous.priceMinor;
    const percent = Math.abs(delta / previous.priceMinor * 100);
    if (Math.abs(delta) >= rules.minimumChangeMinor && percent >= rules.minimumChangePercent) {
      if (delta < 0 && rules.notifyOnPriceDrop) events.push({ type: EventType.PRICE_DROP, description: "Price dropped" });
      if (delta > 0 && rules.notifyOnPriceIncrease) events.push({ type: EventType.PRICE_INCREASE, description: "Price increased" });
    }
    if (rules.notifyOnTargetPrice && rules.targetPriceMinor != null && current.priceMinor <= rules.targetPriceMinor && previous.priceMinor > rules.targetPriceMinor) events.push({ type: EventType.TARGET_PRICE_REACHED, description: "Target price reached" });
  }
  if (rules.notifyOnAvailable && previous.availability !== Availability.IN_STOCK && current.availability === Availability.IN_STOCK) events.push({ type: EventType.BACK_IN_STOCK, description: "Back in stock" });
  if (rules.notifyOnUnavailable && previous.availability === Availability.IN_STOCK && current.availability === Availability.OUT_OF_STOCK) events.push({ type: EventType.OUT_OF_STOCK, description: "Out of stock" });
  if (rules.notifyOnProductChange && ((previous.title && current.title && previous.title !== current.title) || previous.variantValue !== current.variantValue)) events.push({ type: EventType.PRODUCT_CHANGED, description: "Product or variant changed" });
  return events;
}
