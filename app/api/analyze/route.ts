import { NextRequest, NextResponse } from "next/server";
import { analyzeSchema } from "@/lib/validation";
import { fetchProduct } from "@/lib/fetch-product";
import { apiError } from "@/lib/api";

const attempts = new Map<string, number[]>();
export async function POST(request: NextRequest) {
  try {
    const key = request.headers.get("x-forwarded-for") ?? "local";
    const now = Date.now(); const recent = (attempts.get(key) ?? []).filter((value) => now - value < 60_000);
    if (recent.length >= 10) return apiError(new Error("Analysis rate limit reached. Try again shortly."), 429);
    attempts.set(key, [...recent, now]);
    const input = analyzeSchema.parse(await request.json());
    const product = await fetchProduct(input.url, { browserMode: input.browserMode });
    return NextResponse.json({ success: true, product, warnings: product.warnings });
  } catch (error) { return apiError(error); }
}
