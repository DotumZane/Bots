import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { apiError } from "@/lib/api";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bot = await prisma.bot.findUnique({ where: { id }, include: { channels: { include: { notificationChannel: true } } } });
    if (!bot) throw new Error("Bot not found.");
    const channels = bot.channels.filter((link) => link.notificationChannel.enabled);
    if (!channels.length) throw new Error("Select and save at least one enabled notification channel first.");
    const results = await Promise.allSettled(channels.map((link) => sendNotification(link.notificationChannel.type, link.notificationChannel.configurationEncrypted, `Bots test alert\n\n${bot.name}\n${bot.url}`)));
    const failed = results.filter((result) => result.status === "rejected").length;
    return NextResponse.json({ success: failed === 0, sent: results.length - failed, failed }, { status: failed ? 502 : 200 });
  } catch (error) { return apiError(error, 502); }
}
