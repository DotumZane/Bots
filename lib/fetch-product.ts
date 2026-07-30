import { chromium } from "playwright";
import { analyzeHtml } from "./detection";
import { validatePublicUrl } from "./security";
import type { DetectionResult } from "./types";

const USER_AGENT = "Bots/1.0 (+self-hosted product monitor)";
const MAX_BYTES = 5 * 1024 * 1024;

export async function fetchProduct(input: string, options: { browserMode?: boolean; timeoutMs?: number; selectors?: Record<string, string | undefined>; waitForSelector?: string; pageLoadDelayMs?: number } = {}): Promise<DetectionResult> {
  let url = await validatePublicUrl(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
    const response = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" } }).finally(() => clearTimeout(timer));
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new Error("Too many or invalid redirects.");
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Website returned HTTP ${response.status}.`);
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) throw new Error("Page exceeds the 5 MB safety limit.");
    const html = (await response.text()).slice(0, MAX_BYTES);
    let detected = analyzeHtml(html, url.toString(), options.selectors);
    if ((detected.priceMinor == null || options.browserMode) && options.browserMode) {
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage({ userAgent: USER_AGENT });
        await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: options.timeoutMs ?? 30_000 });
        if (options.waitForSelector) await page.waitForSelector(options.waitForSelector, { timeout: options.timeoutMs ?? 30_000 });
        if (options.pageLoadDelayMs) await page.waitForTimeout(Math.min(options.pageLoadDelayMs, 10_000));
        detected = analyzeHtml(await page.content(), url.toString(), options.selectors);
        detected.detectionMethod = "PLAYWRIGHT";
      } finally { await browser.close(); }
    }
    return detected;
  }
  throw new Error("Unable to fetch the product.");
}
