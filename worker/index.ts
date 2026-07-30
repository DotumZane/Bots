import pLimit from "p-limit";
import { prisma } from "../lib/prisma";
import { checkBot } from "../lib/monitor";
const limit = pLimit(Number(process.env.MAX_CONCURRENT_CHECKS ?? 3)); let stopping = false;
const log = (event: string, details: Record<string, unknown> = {}) => console.log(JSON.stringify({ time: new Date().toISOString(), service: "worker", event, ...details }));
async function tick() {
  const due = await prisma.bot.findMany({ where: { enabled: true, nextCheckAt: { lte: new Date() }, OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - 600_000) } }] }, take: 50 });
  await Promise.allSettled(due.map((bot) => limit(async () => {
    const claimed = await prisma.bot.updateMany({ where: { id: bot.id, OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - 600_000) } }] }, data: { lockedAt: new Date() } });
    if (!claimed.count) return; log("scheduled_check", { botId: bot.id, hostname: bot.hostname });
    try { await checkBot(bot.id); } catch (error) { log("check_failed", { botId: bot.id, error: error instanceof Error ? error.message : "unknown" }); }
  })));
}
process.on("SIGTERM", () => { stopping = true; }); process.on("SIGINT", () => { stopping = true; }); log("started");
while (!stopping) { try { await tick(); } catch (error) { log("tick_failed", { error: error instanceof Error ? error.message : "unknown" }); } await new Promise((resolve) => setTimeout(resolve, 30_000)); }
await prisma.$disconnect(); log("stopped");
