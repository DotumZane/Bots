import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function key(): Promise<Buffer> {
  const keyFile = process.env.BOTS_ENCRYPTION_KEY_FILE ?? path.join(process.env.DATA_DIR ?? "./data", "encryption.key");
  try { return Buffer.from((await readFile(keyFile, "utf8")).trim(), "base64"); }
  catch {
    await mkdir(path.dirname(keyFile), { recursive: true });
    const generated = randomBytes(32);
    await writeFile(keyFile, generated.toString("base64"), { mode: 0o600 });
    return generated;
  }
}
export async function encrypt(value: unknown): Promise<string> {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", await key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
}
export async function decrypt<T>(value: string): Promise<T> {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", await key(), iv); decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()) as T;
}
