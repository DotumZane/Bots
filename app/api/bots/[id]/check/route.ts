import { NextResponse } from "next/server";
import { checkBot } from "@/lib/monitor";
import { apiError } from "@/lib/api";
const running = new Set<string>();
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (running.has(id)) return apiError(new Error("This bot is already checking."), 409);
  try { running.add(id); return NextResponse.json({ success: true, result: await checkBot(id) }); }
  catch (error) { return apiError(error, 502); } finally { running.delete(id); }
}
