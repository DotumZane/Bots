import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/Dashboard";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export default async function Home() {
  let bots: Prisma.BotGetPayload<{ include: { states: true } }>[] = [];
  try { bots = await prisma.bot.findMany({ where: { monitorKind: { not: "VALUE" } }, orderBy: { createdAt: "desc" }, include: { states: { where: { successful: true, confirmed: true }, orderBy: { checkedAt: "desc" }, take: 3 } } }); } catch { /* First-run UI remains available before migrations. */ }
  return <Dashboard initialBots={JSON.parse(JSON.stringify(bots))} />;
}
