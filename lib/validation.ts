import { z } from "zod";

export const botSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  hostname: z.string().min(1).max(255),
  monitorKind: z.enum(["PRODUCT", "HTTP", "TCP"]).default("PRODUCT"),
  tcpPort: z.number().int().min(1).max(65535).nullable().optional(),
  latencyThresholdMs: z.number().int().min(1).max(60000).default(1000),
  notifyOnDown: z.boolean().default(true),
  notifyOnRecovery: z.boolean().default(true),
  notifyOnHighLatency: z.boolean().default(true),
  imageUrl: z.string().url().nullable().optional(),
  enabled: z.boolean().default(true),
  checkIntervalMinutes: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal(15), z.literal(30), z.literal(60), z.literal(120), z.literal(240), z.literal(480), z.literal(720), z.literal(1440)]),
  checkIntervalSeconds: z.union([z.literal(10), z.literal(30), z.literal(60), z.literal(300), z.literal(600), z.literal(900), z.literal(1800), z.literal(3600)]).optional(),
  browserMode: z.boolean().default(false),
  notifyOnPriceDrop: z.boolean().default(true),
  notifyOnTargetPrice: z.boolean().default(false),
  targetPriceMinor: z.number().int().nonnegative().nullable().optional(),
  notifyOnAvailable: z.boolean().default(true),
  notifyOnUnavailable: z.boolean().default(false),
  notifyOnPriceIncrease: z.boolean().default(false),
  minimumChangeMinor: z.number().int().nonnegative().default(1),
  minimumChangePercent: z.number().nonnegative().max(100).default(0),
  confirmationCount: z.number().int().min(1).max(10).default(2),
  notificationCooldownMinutes: z.number().int().min(0).max(10080).default(60),
  priceSelector: z.string().max(500).nullable().optional(),
  regularPriceSelector: z.string().max(500).nullable().optional(),
  availabilitySelector: z.string().max(500).nullable().optional(),
  titleSelector: z.string().max(500).nullable().optional(),
  imageSelector: z.string().max(500).nullable().optional(),
  inStockText: z.string().max(100).nullable().optional(),
  outOfStockText: z.string().max(100).nullable().optional(),
  waitForSelector: z.string().max(500).nullable().optional(),
  pageLoadDelayMs: z.number().int().min(0).max(10000).default(0),
  customUserAgent: z.string().max(500).nullable().optional(),
  customHeadersJson: z.string().max(5000).nullable().optional(),
  channelIds: z.array(z.string()).optional(),
}).superRefine((value, context) => {
  if (value.monitorKind === "TCP" && value.tcpPort == null) context.addIssue({ code: "custom", path: ["tcpPort"], message: "A TCP port is required." });
  if (value.monitorKind === "HTTP" && !/^https?:\/\//i.test(value.url)) context.addIssue({ code: "custom", path: ["url"], message: "An HTTP or HTTPS URL is required." });
});

export const analyzeSchema = z.object({ url: z.string().url(), browserMode: z.boolean().optional() });
export const channelSchema = z.object({ name: z.string().min(1).max(100), type: z.enum(["DISCORD", "GOTIFY", "PUSHOVER", "TELEGRAM", "SMTP", "WEBHOOK"]), enabled: z.boolean(), configuration: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])) });
