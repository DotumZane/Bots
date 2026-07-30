"use client";
import Link from "next/link";
import { useState } from "react";

type State = { priceMinor: number | null; currency: string | null; availability: string; checkedAt: string };
type Bot = { id: string; name: string; hostname: string; imageUrl: string | null; enabled: boolean; targetPriceMinor: number | null; lastCheckAt: string | null; nextCheckAt: string; lastError: string | null; states: State[] };
const money = (minor: number | null | undefined, currency = "USD") => minor == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
const time = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Never";

export function Dashboard({ initialBots }: { initialBots: Bot[] }) {
  const [bots, setBots] = useState(initialBots); const [busy, setBusy] = useState<string>(); const [toast, setToast] = useState("");
  const act = async (id: string, action: string) => { setBusy(id + action); const response = await fetch(`/api/bots/${id}/${action}`, { method: "POST" }); const body = await response.json(); setToast(response.ok ? action === "check" ? "Check completed." : `Bot ${action}d.` : body.error?.message); if (response.ok) location.reload(); else setBusy(undefined); };
  const remove = async (id: string) => { if (!confirm("Delete this bot and all of its history?")) return; const response = await fetch(`/api/bots/${id}`, { method: "DELETE" }); if (response.ok) setBots((value) => value.filter((bot) => bot.id !== id)); };
  const current = (bot: Bot) => bot.states[0];
  const summary = [
    ["Total bots", bots.length, "All configured monitors"],
    ["Active", bots.filter((bot) => bot.enabled).length, "Scheduled and running"],
    ["In stock", bots.filter((bot) => current(bot)?.availability === "IN_STOCK").length, "Available right now"],
    ["At target", bots.filter((bot) => bot.targetPriceMinor != null && (current(bot)?.priceMinor ?? Infinity) <= bot.targetPriceMinor!).length, "Ready to buy"],
    ["Need attention", bots.filter((bot) => bot.lastError).length, "Reporting errors"],
  ];
  return <><section className="pageHead"><div><p className="eyebrow">Product monitoring</p><h1>Your watchlist</h1><p>Price and stock changes, without the tab refreshing.</p></div><Link href="/bots/new" className="button primary">＋ Add Bot</Link></section>
    <section className="summaryGrid">{summary.map(([label, value, note]) => <article className="summary" key={String(label)}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
    <section className="panel"><div className="panelHead"><div><h2>Monitoring</h2><p>{bots.length ? `${bots.filter((b) => b.enabled).length} bots are active` : "Add your first product to begin"}</p></div><span className="live">● Scheduler online</span></div>
    {!bots.length ? <div className="empty"><div className="emptyIcon">↘</div><h3>No products yet</h3><p>Paste a product page URL and Bots will find its price and availability.</p><Link href="/bots/new" className="button primary">Add your first bot</Link></div> :
    <div className="botList">{bots.map((bot) => { const state = current(bot); const previous = bot.states[1]; return <article className="botRow" key={bot.id}>
      <div className="productThumb">{bot.imageUrl ? <img src={bot.imageUrl} alt="" /> : <span>↘</span>}</div>
      <div className="productInfo"><h3>{bot.name}</h3><p>{bot.hostname}</p><div className="badges"><span className={`badge ${bot.enabled ? "healthy" : "muted"}`}>{bot.enabled ? "Active" : "Paused"}</span><span className={`badge ${state?.availability === "IN_STOCK" ? "healthy" : state?.availability === "OUT_OF_STOCK" ? "danger" : "muted"}`}>{state?.availability?.replaceAll("_", " ") ?? "UNKNOWN"}</span></div></div>
      <div className="metric"><span>Current price</span><strong>{money(state?.priceMinor, state?.currency ?? "USD")}</strong><small>{previous ? `was ${money(previous.priceMinor, previous.currency ?? "USD")}` : "No previous price"}</small></div>
      <div className="metric"><span>Target</span><strong>{money(bot.targetPriceMinor, state?.currency ?? "USD")}</strong><small>{bot.targetPriceMinor ? "Alert threshold" : "Not set"}</small></div>
      <div className="metric schedule"><span>Last checked</span><strong>{time(bot.lastCheckAt)}</strong><small>{bot.enabled ? `Next ${time(bot.nextCheckAt)}` : "Scheduling paused"}</small>{bot.lastError && <em>{bot.lastError}</em>}</div>
      <div className="rowActions"><button className="iconButton" title="Check now" disabled={busy === bot.id + "check"} onClick={() => act(bot.id, "check")}>↻</button><button className="iconButton" title={bot.enabled ? "Pause" : "Resume"} onClick={() => act(bot.id, bot.enabled ? "pause" : "resume")}>{bot.enabled ? "Ⅱ" : "▶"}</button><Link className="iconButton" title="Edit" href={`/bots/${bot.id}`}>✎</Link><button className="iconButton dangerText" title="Delete" onClick={() => remove(bot.id)}>×</button></div>
    </article>; })}</div>}</section>{toast && <div className="toast" role="status" onClick={() => setToast("")}>{toast}</div>}</>;
}
