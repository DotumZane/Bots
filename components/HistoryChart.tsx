"use client";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type State = { id: string; checkedAt: string; priceMinor: number | null; currency: string | null; availability: string; detectionMethod: string; warning: string | null; confirmed: boolean };
export function HistoryChart({ states, targetPriceMinor }: { states: State[]; targetPriceMinor: number | null }) {
  const [range, setRange] = useState("30");
  const data = useMemo(() => { const newest = states.length ? new Date(states[0].checkedAt).getTime() : 0; const cutoff = range === "all" ? 0 : newest - Number(range) * 86400000; return states.filter((s) => new Date(s.checkedAt).getTime() >= cutoff && s.priceMinor != null).map((s) => ({ ...s, date: new Date(s.checkedAt).toLocaleDateString(), price: s.priceMinor! / 100 })).reverse(); }, [states, range]);
  const currency = states.find((state) => state.currency)?.currency ?? "USD";
  return <section className="formCard historyCard"><div className="historyHead"><div><p className="eyebrow">Timeline</p><h2>Price history</h2></div><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="History range"><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="all">All time</option></select></div>
    {data.length ? <div className="chartWrap"><ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={.18}/><XAxis dataKey="date" tick={{ fontSize: 11 }}/><YAxis tick={{ fontSize: 11 }} domain={["auto","auto"]}/><Tooltip formatter={(value) => new Intl.NumberFormat(undefined,{style:"currency",currency}).format(Number(value))}/>{targetPriceMinor != null && <ReferenceLine y={targetPriceMinor/100} stroke="#ef4d2f" strokeDasharray="5 5" label="Target"/>}<Line type="monotone" dataKey="price" stroke="#ef4d2f" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div> : <div className="miniEmpty">Price history will appear after successful checks.</div>}
    <div className="historyTable">{states.slice(0,12).map((state) => <div key={state.id}><span>{new Date(state.checkedAt).toLocaleString()}</span><b>{state.priceMinor == null ? "—" : new Intl.NumberFormat(undefined,{style:"currency",currency:state.currency??"USD"}).format(state.priceMinor/100)}</b><span className={`badge ${state.availability==="IN_STOCK"?"healthy":state.availability==="OUT_OF_STOCK"?"danger":"muted"}`}>{state.availability.replaceAll("_"," ")}</span><small>{state.confirmed ? state.detectionMethod.replaceAll("_"," ") : "Pending confirmation"}</small></div>)}</div>
  </section>;
}
