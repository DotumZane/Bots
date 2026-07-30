import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ success: true, states: await prisma.productState.findMany({ where: { botId: id }, orderBy: { checkedAt: "desc" }, take: 500 }) }); }
