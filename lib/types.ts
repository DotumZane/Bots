import type { Availability, DetectionMethod, EventType } from "@prisma/client";

export type DetectionResult = {
  title?: string;
  priceMinor?: number;
  regularPriceMinor?: number;
  currency?: string;
  availability: Availability;
  imageUrl?: string;
  variantValue?: string;
  hostname: string;
  detectionMethod: DetectionMethod;
  detectedPrices: number[];
  warnings: string[];
};

export type ChangeEvent = { type: EventType; description: string };
