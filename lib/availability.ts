import { Availability } from "@prisma/client";

export function normalizeAvailability(value?: string | null): Availability {
  if (!value) return Availability.UNKNOWN;
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  if (normalized.includes("outofstock") || normalized.includes("soldout") || normalized.includes("discontinued") || normalized.includes("unavailable")) return Availability.OUT_OF_STOCK;
  if (normalized.includes("preorder")) return Availability.PREORDER;
  if (normalized.includes("backorder")) return Availability.BACKORDER;
  if (normalized.includes("instock") || normalized.includes("limitedavailability") || normalized.includes("onlineonly") || normalized === "available") return Availability.IN_STOCK;
  return Availability.UNKNOWN;
}
