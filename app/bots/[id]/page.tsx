import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BotForm } from "@/components/BotForm";
import { AdvancedBotSettings } from "@/components/AdvancedBotSettings";
import { HistoryChart } from "@/components/HistoryChart";

export const dynamic = "force-dynamic";
export default async function EditBot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bot, channels] = await Promise.all([
    prisma.bot.findUnique({ where: { id }, include: { states: { orderBy: { checkedAt: "desc" }, take: 500 }, events: { include: { deliveries: true }, orderBy: { createdAt: "desc" }, take: 50 }, channels: true } }),
    prisma.notificationChannel.findMany({ select: { id: true, name: true, type: true, enabled: true }, orderBy: { name: "asc" } }),
  ]);
  if (!bot) notFound();
  const latest = bot.states[0];
  const pending = bot.states.filter((state) => !state.confirmed && state.successful).length;
  const health = [
    ["Status", bot.enabled ? bot.lastError ? "Needs attention" : "Healthy" : "Paused"],
    ["Detection", latest?.detectionMethod?.replaceAll("_", " ") ?? "No checks yet"],
    ["Confirmation", pending ? `${pending} pending result${pending === 1 ? "" : "s"}` : "Confirmed"],
    ["Errors", bot.consecutiveErrors ? `${bot.consecutiveErrors} consecutive` : "None"],
    ["Last success", bot.lastSuccessfulCheckAt?.toLocaleString() ?? "Never"],
    ["Warning", latest?.warning ?? "None"],
  ];
  return <><div className="crumb"><Link href="/">Dashboard</Link><span>/</span><span>Edit Bot</span></div>
    <section className="pageHead compact"><div><p className="eyebrow">Product monitor</p><h1>Edit {bot.name}</h1><p>Rules, diagnostics, variants, delivery, and history in one place.</p></div></section>
    <section className="healthGrid">{health.map(([label,value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <BotForm initial={JSON.parse(JSON.stringify(bot))}/>
    <AdvancedBotSettings bot={JSON.parse(JSON.stringify(bot))} channels={JSON.parse(JSON.stringify(channels))}/>
    <HistoryChart states={JSON.parse(JSON.stringify(bot.states))} targetPriceMinor={bot.targetPriceMinor}/>
    <section className="formCard eventCard"><p className="eyebrow">Activity</p><h2>Alerts & delivery</h2>{bot.events.length ? <div className="eventList">{bot.events.map((event) => <div key={event.id}><span className="badge muted">{event.eventType.replaceAll("_"," ")}</span><b>{event.message}</b><small>{event.createdAt.toLocaleString()} · {event.deliveries.length ? `${event.deliveries.filter((d)=>d.successful).length}/${event.deliveries.length} delivered` : "No channels assigned"}</small></div>)}</div> : <div className="miniEmpty">Meaningful changes and notification deliveries will appear here.</div>}</section>
  </>;
}
