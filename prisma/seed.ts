import { PrismaClient } from "@prisma/client";
import { encrypt } from "../lib/crypto";
const prisma = new PrismaClient();
if (process.env.NODE_ENV === "production") throw new Error("Development seed is disabled in production.");
const now = new Date();
const samples = [
  { name: "Cordless Drill Kit", url: "https://example.com/drill", hostname: "example.com", targetPriceMinor: 9900, nextCheckAt: now },
  { name: "Limited Edition Console", url: "https://example.com/console", hostname: "example.com", nextCheckAt: now },
  { name: "Workshop Vacuum", url: "https://example.com/vacuum", hostname: "example.com", enabled: false, nextCheckAt: now },
  { name: "Smart Thermostat", url: "https://example.com/thermostat", hostname: "example.com", lastError: "Website returned HTTP 403.", consecutiveErrors: 2, nextCheckAt: now },
];
for (const sample of samples) {
  const exists = await prisma.bot.findFirst({ where: { url: sample.url } });
  if (!exists) await prisma.bot.create({ data: sample });
}
if (!(await prisma.notificationChannel.findFirst({ where: { name: "Sample Discord" } }))) await prisma.notificationChannel.create({ data: { name: "Sample Discord", type: "DISCORD", enabled: false, configurationEncrypted: await encrypt({ webhookUrl: "https://discord.invalid/placeholder" }) } });
await prisma.$disconnect();
