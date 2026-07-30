import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";

const schema = z.object({
  notifyOnHistoricalLow: z.boolean(),
  notifyOnProductChange: z.boolean(),
  minimumChangeMinor: z.number().int().nonnegative(),
  minimumChangePercent: z.number().min(0).max(100),
  variantName: z.string().max(100).nullable(),
  variantSelector: z.string().max(500).nullable(),
  variantValue: z.string().max(200).nullable(),
  channelIds: z.array(z.string()),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { channelIds, ...data } = schema.parse(await request.json());
    const bot = await prisma.$transaction(async (tx) => {
      await tx.botNotificationChannel.deleteMany({ where: { botId: id } });
      return tx.bot.update({ where: { id }, data: { ...data, channels: { create: channelIds.map((notificationChannelId) => ({ notificationChannelId })) } } });
    });
    return NextResponse.json({ success: true, bot });
  } catch (error) { return apiError(error); }
}
