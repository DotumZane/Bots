import type { ChannelType } from "@prisma/client";
import { decrypt } from "./crypto";
type Config = Record<string, string | number | boolean>;
export function renderTemplate(template: string, values: Record<string, string | number | null | undefined>): string { return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? "")); }
export async function sendNotification(type: ChannelType, encrypted: string, message: string) {
  const config = await decrypt<Config>(encrypted); let url = ""; const init: RequestInit = { method: "POST", headers: { "content-type": "application/json" } };
  if (type === "DISCORD") { url = String(config.webhookUrl); init.body = JSON.stringify({ content: message }); }
  else if (type === "GOTIFY") { url = `${String(config.serverUrl).replace(/\/$/, "")}/message?token=${encodeURIComponent(String(config.token))}`; init.body = JSON.stringify({ title: "Bots Alert", message, priority: Number(config.priority ?? 5) }); }
  else if (type === "PUSHOVER") { url = "https://api.pushover.net/1/messages.json"; init.headers = { "content-type": "application/x-www-form-urlencoded" }; init.body = new URLSearchParams({ token: String(config.token), user: String(config.userKey), message }).toString(); }
  else if (type === "TELEGRAM") { url = `https://api.telegram.org/bot${String(config.botToken)}/sendMessage`; init.body = JSON.stringify({ chat_id: config.chatId, text: message }); }
  else if (type === "WEBHOOK") { url = String(config.url); init.method = String(config.method ?? "POST"); init.body = renderTemplate(String(config.bodyTemplate ?? '{"message":"{{message}}"}'), { message }); }
  else throw new Error("SMTP testing requires a configured mail transport.");
  const response = await fetch(url, init); const responseBody = (await response.text()).slice(0, 2000);
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  return { status: response.status, responseBody };
}
