import dns from "node:dns/promises";
import net from "node:net";

export function isPrivateAddress(address: string): boolean {
  if (net.isIPv6(address)) {
    const value = address.toLowerCase();
    return value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
  }
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

export async function validatePublicUrl(input: string): Promise<URL> {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("Enter a valid URL."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are allowed.");
  if (url.username || url.password) throw new Error("URLs containing credentials are not allowed.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "metadata.google.internal") throw new Error("Local and metadata addresses are blocked.");
  const records = await dns.lookup(hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) throw new Error("Private, loopback, and link-local addresses are blocked.");
  return url;
}
