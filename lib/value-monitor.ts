import * as cheerio from "cheerio";
import { validatePublicUrl } from "./security";
import { chromium } from "playwright";
import type { Element } from "domhandler";

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

async function fetchWithBrowser(target:URL,selector?:string|null) {
  let browser;
  try{browser=await chromium.launch({headless:true});}catch(error){const message=error instanceof Error?error.message:"";if(message.includes("Executable doesn't exist")||message.includes("shared libraries")||message.includes("browser has been closed"))throw new Error("Browser scanning could not start. Update the Bots container and try again.");throw error;}
  try { const page=await browser.newPage({userAgent:USER_AGENT});
    await page.route("**/*",async(route)=>{if(route.request().isNavigationRequest()){try{await validatePublicUrl(route.request().url());}catch{return route.abort();}}return route.continue();});
    const response=await page.goto(target.toString(),{waitUntil:"domcontentloaded",timeout:30_000});
    if(!response)throw new Error("The browser did not receive a response from the page.");
    if(response.status()>=400)throw new Error(`Website returned HTTP ${response.status()} even in browser mode.`);
    if(selector)await page.waitForSelector(selector,{timeout:10_000});
    return page.content();
  } finally {await browser.close();}
}

async function loadHtml(url:string,browserMode=false,selector?:string|null) {
  let target = await validatePublicUrl(url);
  let response: Response | null = null;
  for (let redirects=0;redirects<=5;redirects++) {
    response = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "user-agent": USER_AGENT, accept:"text/html,application/xhtml+xml" } });
    if (response.status < 300 || response.status >= 400) break;
    const location=response.headers.get("location"); if(!location) throw new Error("The page redirected without a destination.");
    target=await validatePublicUrl(new URL(location,target).toString());
  }
  if (!response || (response.status >= 300 && response.status < 400)) throw new Error("The page redirected too many times.");
  if (browserMode || response.status===403 || response.status===429) return fetchWithBrowser(target,selector);
  if (!response.ok) throw new Error(`Page returned HTTP ${response.status}.`);
  return response.text();
}

export async function fetchNumericValue(url: string, options: { selector?: string | null; label?: string | null; browserMode?:boolean }): Promise<ValueResult> {
  const started = performance.now();
  const html = await loadHtml(url,options.browserMode,options.selector);
  return { ...valueFromHtml(html,options), responseTimeMs: Math.max(1, Math.round(performance.now() - started)) };
}

export type ValueCandidate={label:string;value:number;unit:string;selector:string;sample:string};
const clean=(value:string)=>value.replace(/\s+/g," ").trim();
function selectorFor($:cheerio.CheerioAPI,element:Element) {
  const node=$(element); const id=node.attr("id"); if(id&&/^[A-Za-z][\w-]*$/.test(id))return `#${id}`;
  const testId=node.attr("data-testid"); if(testId&&!testId.includes('"'))return `[data-testid="${testId}"]`;
  const className=(node.attr("class")??"").split(/\s+/).find((item)=>/^[A-Za-z][\w-]*$/.test(item)); if(className)return `${element.tagName}.${className}`;
  const parts:string[]=[];let current=element;
  for(let depth=0;current&&current.type==="tag"&&depth<4;depth++) {const currentNode=$(current);const siblings=currentNode.parent().children(current.tagName);const position=siblings.toArray().indexOf(current)+1;parts.unshift(`${current.tagName}:nth-of-type(${position})`);current=current.parent as Element;}
  return parts.join(" > ");
}

export function discoverValuesFromHtml(html:string):ValueCandidate[] {
  const $=cheerio.load(html); const candidates:ValueCandidate[]=[]; const seen=new Set<string>();
  $("span,p,div,td,th,strong,b,li,dd").each((_,element)=>{const node=$(element);if(node.children().length>2)return;const sample=clean(node.text());if(!sample||sample.length>140||!/[0-9]/.test(sample))return;let value:number;try{value=extractNumber(sample);}catch{return;}const selector=selectorFor($,element);if(!selector||seen.has(`${selector}:${value}`))return;seen.add(`${selector}:${value}`);const unit=sample.includes("%")?"%":sample.match(/[$€£¥]/)?.[0]??"";const ownLabel=clean(node.attr("aria-label")??node.attr("title")??"");const context=clean(node.parent().text()).slice(0,140);const label=ownLabel||context.replace(sample,"").replace(/[:|–—-]+$/g,"").trim().slice(0,80)||"Tracked value";candidates.push({label,value,unit,selector,sample});});
  return candidates.sort((a,b)=>Number(Boolean(b.unit))-Number(Boolean(a.unit))||a.sample.length-b.sample.length).slice(0,50);
}
export async function discoverNumericValues(url:string):Promise<ValueCandidate[]> {return discoverValuesFromHtml(await loadHtml(url));}
