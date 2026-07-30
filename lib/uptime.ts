import net from "node:net";

export type UptimeResult = {
  reachable: boolean;
  responseTimeMs: number;
  status?: number;
  error?: string;
};

export async function checkHttp(url: string): Promise<UptimeResult> {
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
    await response.body?.cancel();
    return { reachable: response.status < 500, responseTimeMs, status: response.status, error: response.status >= 500 ? `HTTP ${response.status}` : undefined };
  } catch (error) {
    return { reachable: false, responseTimeMs: Math.max(1, Math.round(performance.now() - started)), error: error instanceof Error ? error.message : "Connection failed." };
  }
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
