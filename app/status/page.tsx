import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service Status" };

export default async function StatusPage() {
  const bots = await prisma.bot.findMany({ where: { monitorKind: { not: "PRODUCT" } }, orderBy: { name: "asc" }, include: { states: { where: { successful: true }, orderBy: { checkedAt: "desc" }, take: 1 } } });
  const now = Date.now();
  const rows = await Promise.all(bots.map(async (bot) => {
    const windows = await Promise.all([1,7,30].map(async (days) => {
      const where = { botId: bot.id, successful: true, checkedAt: { gte: new Date(now-days*86_400_000) } };
      const [total, online] = await Promise.all([prisma.productState.count({where}),prisma.productState.count({where:{...where,reachable:true}})]);
      return total ? Math.round(online/total*10000)/100 : null;
    }));
    return { bot, windows };
  }));
  const allOnline = rows.every(({bot})=>bot.states[0]?.reachable !== false);
  return <><section className="pageHead"><div><p className="eyebrow">Live health</p><h1>Service status</h1><p>{allOnline?"All monitored services are operational.":"One or more monitored services need attention."}</p></div><span className={`badge ${allOnline?"healthy":"danger"}`}>{allOnline?"All operational":"Service disruption"}</span></section><section className="statusGrid">{rows.length?rows.map(({bot,windows})=>{const latest=bot.states[0];return <article className="statusRow" key={bot.id}><div><h2>{bot.name}</h2><p>{bot.hostname}{bot.tcpPort?`:${bot.tcpPort}`:""}</p></div><span className={`badge ${latest?.reachable===true?"healthy":latest?.reachable===false?"danger":"muted"}`}>{latest?.reachable===true?"Operational":latest?.reachable===false?"Offline":"Pending"}</span><div className="statusMetric"><b>{latest?.responseTimeMs!=null?`${latest.responseTimeMs} ms`:"—"}</b><small>Current response</small></div><div className="statusMetric"><b>{windows[0]??"—"}% / {windows[1]??"—"}% / {windows[2]??"—"}%</b><small>1d / 7d / 30d uptime</small></div></article>}):<div className="miniEmpty">No uptime monitors have been added yet.</div>}</section></>;
}
