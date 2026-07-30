"use client";
import { useState } from "react";

export function SettingsForm({ initial }: { initial: Record<string, string | number | boolean> }) {
  const [saved, setSaved] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const settings: Record<string, string | number | boolean> = {};
    form.forEach((value, key) => { settings[key] = String(value); });
    await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) });
    setSaved(true);
  };
  return <form className="formStack" onSubmit={submit}>
    <section className="formCard"><h2>General</h2><div className="fieldGrid">
      <label>Application name<input name="appName" defaultValue={String(initial.appName ?? "Bots")} /></label>
      <label>Default check interval<select name="defaultInterval" defaultValue={String(initial.defaultInterval ?? "30")}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option></select></label>
      <label>Time zone<input name="timezone" defaultValue={String(initial.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)} /></label>
      <label>Theme<select name="theme" defaultValue={String(initial.theme ?? "system")}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
    </div></section>
    <section className="formCard"><h2>Monitoring</h2><div className="fieldGrid">
      <label>Maximum simultaneous checks<input type="number" name="maxConcurrentChecks" min="1" max="10" defaultValue={String(initial.maxConcurrentChecks ?? 3)} /></label>
      <label>Request timeout (seconds)<input type="number" name="requestTimeout" min="5" max="120" defaultValue={String(initial.requestTimeout ?? 15)} /></label>
      <label>Browser timeout (seconds)<input type="number" name="browserTimeout" min="10" max="180" defaultValue={String(initial.browserTimeout ?? 30)} /></label>
      <label>History retention<select name="historyRetention" defaultValue={String(initial.historyRetention ?? "90")}><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">1 year</option><option value="forever">Forever</option></select></label>
    </div></section>
    <section className="formCard"><h2>Backup & restore</h2><p className="help">Exports omit notification secrets by default.</p><div className="buttonRow"><button type="button" className="button secondary" onClick={() => fetch("/api/settings/export", { method: "POST" }).then((r) => r.blob()).then((blob) => { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "bots-export.json"; link.click(); })}>Export configuration</button></div></section>
    <div className="formActions">{saved && <span className="saved">Settings saved</span>}<button className="button primary">Save settings</button></div>
  </form>;
}
