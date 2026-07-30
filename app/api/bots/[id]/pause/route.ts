import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ success: true, bot: await prisma.bot.update({ where: { id }, data: { enabled: false } }) }); }
