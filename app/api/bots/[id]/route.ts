import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { botSchema } from "@/lib/validation";
import { apiError } from "@/lib/api";
import { validatePublicUrl } from "@/lib/security";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const bot = await prisma.bot.findUnique({ where: { id }, include: { channels: true } });
  return bot ? NextResponse.json({ success: true, bot }) : apiError(new Error("Bot not found."), 404);
}
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const { channelIds = [], ...data } = botSchema.parse(await request.json());
    if (data.monitorKind === "PRODUCT" || data.monitorKind === "VALUE") await validatePublicUrl(data.url);
    const bot = await prisma.$transaction(async (tx) => { await tx.botNotificationChannel.deleteMany({ where: { botId: id } }); return tx.bot.update({ where: { id }, data: { ...data, channels: { create: channelIds.map((notificationChannelId) => ({ notificationChannelId })) } } }); });
    return NextResponse.json({ success: true, bot });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await prisma.bot.delete({ where: { id } }); return NextResponse.json({ success: true }); }
  catch (error) { return apiError(error); }
}
