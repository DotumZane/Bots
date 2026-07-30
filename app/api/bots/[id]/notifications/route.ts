import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ success: true, events: await prisma.notificationEvent.findMany({ where: { botId: id }, include: { deliveries: true }, orderBy: { createdAt: "desc" } }) }); }
