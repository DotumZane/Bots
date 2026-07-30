"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = { id: string; name: string; url: string; hostname: string; monitorKind: "HTTP" | "TCP"; tcpPort: number | null; latencyThresholdMs: number; notifyOnDown: boolean; notifyOnRecovery: boolean; notifyOnHighLatency: boolean; checkIntervalMinutes: number; notificationCooldownMinutes: number; enabled: boolean; channels?: { notificationChannelId: string }[] };
export function UptimeForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [kind, setKind] = useState<"HTTP" | "TCP">(initial?.monitorKind ?? "HTTP");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const target = String(data.get("target")).trim();
    const port = kind === "TCP" ? Number(data.get("port")) : null;
    let hostname: string;
    let url: string;
    try {
      if (kind === "HTTP") {
        const normalizedTarget = /^https?:\/\//i.test(target) ? target : `http://${target}`;
        const parsed = new URL(normalizedTarget);
        hostname = parsed.hostname;
        url = parsed.toString();
      } else {
        hostname = target;
        url = `tcp://${target}:${port}`;
      }
    } catch {
      return setError("Enter a valid website URL or server hostname.");
    }
    const body = {
      name: String(data.get("name")),
      url,
      hostname,
      monitorKind: kind,
      tcpPort: port,
      latencyThresholdMs: Number(data.get("latencyThresholdMs")),
      notifyOnDown: data.get("notifyOnDown") === "on",
      notifyOnRecovery: data.get("notifyOnRecovery") === "on",
      notifyOnHighLatency: data.get("notifyOnHighLatency") === "on",
      enabled: initial?.enabled ?? true,
      checkIntervalMinutes: Number(data.get("interval")),
      browserMode: false,
      notifyOnPriceDrop: false,
      notifyOnTargetPrice: false,
      targetPriceMinor: null,
      notifyOnAvailable: false,
      notifyOnUnavailable: false,
      notifyOnPriceIncrease: false,
      minimumChangeMinor: 1,
      minimumChangePercent: 0,
      confirmationCount: 1,
      notificationCooldownMinutes: Number(data.get("cooldown")),
      pageLoadDelayMs: 0,
      channelIds: initial?.channels?.map((channel) => channel.notificationChannelId) ?? [],
    };
    const response = await fetch(initial ? `/api/bots/${initial.id}` : "/api/bots", { method: initial ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) return setError(result.error?.message ?? "Could not save uptime monitor.");
    router.push(`/bots/${result.bot.id}`);
    router.refresh();
  };

  return <form className="formStack" onSubmit={submit}>
    <section className="formCard">
      <div className="step"><span>1</span><div><h2>Target</h2><p>Monitor a website over HTTP/HTTPS or a server port over TCP.</p></div></div>
      <div className="fieldGrid">
        <label>Monitor type<select value={kind} onChange={(event) => setKind(event.target.value as "HTTP" | "TCP")}><option value="HTTP">Website (HTTP/HTTPS)</option><option value="TCP">Server port (TCP)</option></select></label>
        <label>Monitor name<input name="name" required defaultValue={initial?.name} placeholder="My website" /></label>
        <label>{kind === "HTTP" ? "Website, hostname, or IP" : "Server hostname or IP"}<input name="target" required defaultValue={initial ? kind === "HTTP" ? initial.url : initial.hostname : ""} placeholder={kind === "HTTP" ? "example.com or 192.168.1.20:8080" : "server.example.com or 192.168.1.20"} /></label>
        {kind === "TCP" && <label>Port<input name="port" type="number" min="1" max="65535" required defaultValue={initial?.tcpPort ?? 443} /></label>}
      </div>
    </section>
    <section className="formCard">
      <div className="step"><span>2</span><div><h2>Alert rules</h2><p>Choose when Bots should notify you.</p></div></div>
      <div className="checkGrid">
        <label className="check"><input name="notifyOnDown" type="checkbox" defaultChecked={initial?.notifyOnDown ?? true} /><span><b>Unreachable</b><small>Alert when the target cannot be reached</small></span></label>
        <label className="check"><input name="notifyOnRecovery" type="checkbox" defaultChecked={initial?.notifyOnRecovery ?? true} /><span><b>Recovered</b><small>Alert when the target comes back online</small></span></label>
        <label className="check"><input name="notifyOnHighLatency" type="checkbox" defaultChecked={initial?.notifyOnHighLatency ?? true} /><span><b>Slow response</b><small>Alert when response time exceeds the threshold</small></span></label>
      </div>
      <div className="fieldGrid">
        <label>Slow-response threshold (ms)<input name="latencyThresholdMs" type="number" min="1" max="60000" defaultValue={initial?.latencyThresholdMs ?? 1000} required /></label>
        <label>Check interval<select name="interval" defaultValue={initial?.checkIntervalMinutes ?? 5}><option value="1">1 minute</option><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option></select></label>
        <label>Notification cooldown (minutes)<input name="cooldown" type="number" min="0" max="10080" defaultValue={initial?.notificationCooldownMinutes ?? 60} required /></label>
      </div>
      {error && <p className="formError">{error}</p>}
    </section>
    <div className="formActions"><button type="button" className="button ghost" onClick={() => router.back()}>Cancel</button><button className="button primary">{initial ? "Save Uptime Monitor" : "Create Uptime Monitor"}</button></div>
  </form>;
}
