import net from "node:net";
import tls from "node:tls";
import { promises as dns } from "node:dns";

export type UptimeResult = {
  reachable: boolean;
  responseTimeMs: number;
  status?: number;
  error?: string;
  contentMatched?: boolean;
};

export async function checkHttp(url: string, expectedContent?: string | null): Promise<UptimeResult> {
  const target = new URL(url);
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("Uptime websites must use HTTP or HTTPS.");
  const started = performance.now();
  try {
    const response = await fetch(target, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "Bots Uptime Monitor/1.0" },
    });
    const responseTimeMs = Math.max(1, Math.round(performance.now() - started));
    const body = expectedContent ? await response.text() : "";
    if (!expectedContent) await response.body?.cancel();
    const contentMatched = expectedContent ? body.includes(expectedContent) : undefined;
    const reachable = response.status < 500 && contentMatched !== false;
    const error = response.status >= 500 ? `HTTP ${response.status}` : contentMatched === false ? `Expected text was not found: ${expectedContent}` : undefined;
    return { reachable, responseTimeMs, status: response.status, error, contentMatched };
  } catch (error) {
    return { reachable: false, responseTimeMs: Math.max(1, Math.round(performance.now() - started)), error: error instanceof Error ? error.message : "Connection failed." };
  }
}

export async function resolveAddresses(hostname: string) {
  const results = await dns.lookup(hostname, { all: true });
  return [...new Set(results.map((result) => result.address))].sort();
}

export function getCertificateExpiry(hostname: string, port = 443): Promise<Date> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port, servername: net.isIP(hostname) ? undefined : hostname, rejectUnauthorized: false });
    const done = (error?: Error) => { socket.destroy(); if (error) reject(error); };
    socket.setTimeout(10_000);
    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      const expires = certificate.valid_to ? new Date(certificate.valid_to) : null;
      if (!expires || Number.isNaN(expires.getTime())) return done(new Error("Could not read the SSL certificate expiry."));
      socket.destroy(); resolve(expires);
    });
    socket.once("timeout", () => done(new Error("SSL certificate check timed out.")));
    socket.once("error", done);
  });
}

export function checkTcp(host: string, port: number): Promise<UptimeResult> {
  return new Promise((resolve) => {
    const started = performance.now();
    const socket = net.createConnection({ host, port });
    const finish = (reachable: boolean, error?: string) => {
      const responseTimeMs = Math.max(1, Math.round(performance.now() - started));
      socket.destroy();
      resolve({ reachable, responseTimeMs, error });
    };
    socket.setTimeout(10_000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false, "Connection timed out."));
    socket.once("error", (error) => finish(false, error.message));
  });
}
