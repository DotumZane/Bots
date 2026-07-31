import * as cheerio from "cheerio";
import { validatePublicUrl } from "./security";
import { chromium } from "playwright";

export type ValueResult = { value: number; responseTimeMs: number; matchedText: string };

export const extractNumber = (text: string) => {
  const match = text.replaceAll(",", "").match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) throw new Error("No numeric value was found on the page.");
  const value = Number(match[0]);
  if (!Number.isFinite(value)) throw new Error("The detected value is not a valid number.");
  return value;
};

const USER_AGENT="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function valueFromHtml(html:string,options:{selector?:string|null;label?:string|null}) {
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
  return {value:extractNumber(matchedText),matchedText:matchedText.slice(0,200)};
}

async function fetchWithBrowser(target:URL,options:{selector?:string|null;label?:string|null}) {
  const browser=await chromium.launch({headless:true});
  try { const page=await browser.newPage({userAgent:USER_AGENT});
    await page.route("**/*",async(route)=>{if(route.request().isNavigationRequest()){try{await validatePublicUrl(route.request().url());}catch{return route.abort();}}return route.continue();});
    const response=await page.goto(target.toString(),{waitUntil:"domcontentloaded",timeout:30_000});
    if(!response)throw new Error("The browser did not receive a response from the page.");
    if(response.status()>=400)throw new Error(`Website returned HTTP ${response.status()} even in browser mode.`);
    if(options.selector)await page.waitForSelector(options.selector,{timeout:10_000});
    return valueFromHtml(await page.content(),options);
  } finally {await browser.close();}
}

export async function fetchNumericValue(url: string, options: { selector?: string | null; label?: string | null; browserMode?:boolean }): Promise<ValueResult> {
  const started = performance.now();
  let target = await validatePublicUrl(url);
  let response: Response | null = null;
  for (let redirects=0;redirects<=5;redirects++) {
    response = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "user-agent": USER_AGENT, accept:"text/html,application/xhtml+xml" } });
    if (response.status < 300 || response.status >= 400) break;
    const location=response.headers.get("location"); if(!location) throw new Error("The page redirected without a destination.");
    target=await validatePublicUrl(new URL(location,target).toString());
  }
  if (!response || (response.status >= 300 && response.status < 400)) throw new Error("The page redirected too many times.");
  if (options.browserMode || response.status===403 || response.status===429) {const detected=await fetchWithBrowser(target,options);return {...detected,responseTimeMs:Math.max(1,Math.round(performance.now()-started))};}
  if (!response.ok) throw new Error(`Page returned HTTP ${response.status}.`);
  const html = await response.text();
  return { ...valueFromHtml(html,options), responseTimeMs: Math.max(1, Math.round(performance.now() - started)) };
}
