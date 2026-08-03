import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { botSchema } from "@/lib/validation";
import { validatePublicUrl } from "@/lib/security";
import { apiError } from "@/lib/api";

export async function GET() {
  const bots = await prisma.bot.findMany({ where: { monitorKind: { not: "VALUE" } }, orderBy: { createdAt: "desc" }, include: { states: { where: { successful: true, confirmed: true }, orderBy: { checkedAt: "desc" }, take: 2 } } });
  return NextResponse.json({ success: true, bots });
}
export async function POST(request: Request) {
  try {
    const { channelIds = [], ...data } = botSchema.parse(await request.json());
    if (data.monitorKind === "PRODUCT") await validatePublicUrl(data.url);
    const bot = await prisma.bot.create({ data: { ...data, channels: { create: channelIds.map((notificationChannelId) => ({ notificationChannelId })) } } });
    return NextResponse.json({ success: true, bot }, { status: 201 });
  } catch (error) { return apiError(error); }
}
