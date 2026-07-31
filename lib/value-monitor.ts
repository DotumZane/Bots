import * as cheerio from "cheerio";
import { validatePublicUrl } from "./security";

export type ValueResult = { value: number; responseTimeMs: number; matchedText: string };

export const extractNumber = (text: string) => {
  const match = text.replaceAll(",", "").match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) throw new Error("No numeric value was found on the page.");
  const value = Number(match[0]);
  if (!Number.isFinite(value)) throw new Error("The detected value is not a valid number.");
  return value;
};

export async function fetchNumericValue(url: string, options: { selector?: string | null; label?: string | null }): Promise<ValueResult> {
  const started = performance.now();
  let target = await validatePublicUrl(url);
  let response: Response | null = null;
  for (let redirects=0;redirects<=5;redirects++) {
    response = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "user-agent": "Bots Value Monitor/1.0" } });
    if (response.status < 300 || response.status >= 400) break;
    const location=response.headers.get("location"); if(!location) throw new Error("The page redirected without a destination.");
    target=await validatePublicUrl(new URL(location,target).toString());
  }
  if (!response || (response.status >= 300 && response.status < 400)) throw new Error("The page redirected too many times.");
  if (!response.ok) throw new Error(`Page returned HTTP ${response.status}.`);
  const html = await response.text();
  const $ = cheerio.load(html);
  let matchedText = options.selector ? $(options.selector).first().text().trim() : "";
  if (options.selector && !matchedText) throw new Error(`The selector ${options.selector} did not match any text.`);
  if (!matchedText && options.label) {
    const bodyText = $("body").text().replace(/\s+/g, " ");
    const index = bodyText.toLowerCase().indexOf(options.label.toLowerCase());
    if (index >= 0) matchedText = bodyText.slice(index + options.label.length, index + options.label.length + 120);
  }
  if (!matchedText) {
    const bodyText = $("body").text().replace(/\s+/g, " ");
    matchedText = bodyText.match(/[-+]?\d+(?:\.\d+)?\s*%/)?.[0] ?? bodyText;
  }
  return { value: extractNumber(matchedText), responseTimeMs: Math.max(1, Math.round(performance.now() - started)), matchedText: matchedText.slice(0, 200) };
}
