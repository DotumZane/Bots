import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown, status = 400) {
  const message = error instanceof ZodError ? "Validation failed." : error instanceof Error ? error.message : "Unexpected error.";
  const details = error instanceof ZodError ? error.issues : undefined;
  return NextResponse.json({ success: false, error: { message, details } }, { status });
}
