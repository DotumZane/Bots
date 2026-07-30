"use client";
import { useState } from "react";

type Channel = { id: string; name: string; type: string; enabled: boolean };
type Bot = { id: string; monitorKind?: string; notifyOnHistoricalLow: boolean; notifyOnProductChange: boolean; minimumChangeMinor: number; minimumChangePercent: number; variantName: string | null; variantSelector: string | null; variantValue: string | null; channels: { notificationChannelId: string }[] };

export function AdvancedBotSettings({ bot, channels }: { bot: Bot; channels: Channel[] }) {
  const [message, setMessage] = useState("");
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const body = { notifyOnHistoricalLow: form.get("historicalLow") === "on", notifyOnProductChange: form.get("productChange") === "on",
      minimumChangeMinor: Math.round(Number(form.get("minimumAmount") || 0) * 100), minimumChangePercent: Number(form.get("minimumPercent") || 0),
      variantName: String(form.get("variantName") || "") || null, variantSelector: String(form.get("variantSelector") || "") || null,
      variantValue: String(form.get("variantValue") || "") || null, channelIds: form.getAll("channelIds").map(String) };
    const response = await fetch(`/api/bots/${bot.id}/features`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setMessage(response.ok ? "Advanced monitoring settings saved." : "Could not save settings.");
  };
  const test = async () => { setMessage("Sending test…"); const response = await fetch(`/api/bots/${bot.id}/test-notifications`, { method: "POST" }); const body = await response.json(); setMessage(response.ok ? `Test delivered to ${body.sent} channel${body.sent === 1 ? "" : "s"}.` : body.error?.message ?? "Notification test failed."); };
  const product = !bot.monitorKind || bot.monitorKind === "PRODUCT";
  return <form className="formCard featureCard" onSubmit={save}><div className="featureHead"><div><p className="eyebrow">Delivery</p><h2>{product ? "Alerts, variants & delivery" : "Notification channels"}</h2><p className="help">Choose where alerts from this monitor are sent.</p></div></div>
    {product && <><div className="checkGrid"><label className="check"><input name="historicalLow" type="checkbox" defaultChecked={bot.notifyOnHistoricalLow}/><span><b>New historical low</b><small>Alert when price beats every confirmed result</small></span></label><label className="check"><input name="productChange" type="checkbox" defaultChecked={bot.notifyOnProductChange}/><span><b>Product or variant changed</b><small>Alert when the tracked title or variant changes</small></span></label></div>
    <div className="fieldGrid"><label>Minimum change amount<input name="minimumAmount" type="number" min="0" step=".01" defaultValue={bot.minimumChangeMinor / 100}/></label><label>Minimum change percentage<input name="minimumPercent" type="number" min="0" max="100" step=".1" defaultValue={bot.minimumChangePercent}/></label></div>
    <h3 className="subhead">Product variant</h3><div className="fieldGrid"><label>Variant name<input name="variantName" defaultValue={bot.variantName ?? ""} placeholder="Storage, color, size…"/></label><label>Expected value<input name="variantValue" defaultValue={bot.variantValue ?? ""} placeholder="2 TB, Black, XL…"/></label><label>Variant CSS selector<input name="variantSelector" defaultValue={bot.variantSelector ?? ""} placeholder="[data-selected-variant]"/></label></div></>}
    <h3 className="subhead">Notification channels</h3>{channels.length ? <div className="channelChecks">{channels.map((channel) => <label className="check" key={channel.id}><input name="channelIds" value={channel.id} type="checkbox" disabled={!channel.enabled} defaultChecked={bot.channels.some((link) => link.notificationChannelId === channel.id)}/><span><b>{channel.name}</b><small>{channel.type}{channel.enabled ? "" : " · disabled"}</small></span></label>)}</div> : <p className="help">Configure a notification channel in Settings first.</p>}
    <div className="formActions"><span className="saved">{message}</span><button type="button" className="button secondary" onClick={test}>Send test alert</button><button className="button primary">Save notification channels</button></div>
  </form>;
}
