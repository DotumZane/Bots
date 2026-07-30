import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; import { channelSchema } from "@/lib/validation"; import { decrypt, encrypt } from "@/lib/crypto"; import { apiError } from "@/lib/api";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { try {
  const { id } = await params;
  const current = await prisma.notificationChannel.findUniqueOrThrow({ where: { id } });
  const { configuration, ...data } = channelSchema.parse(await request.json());
  const existing = await decrypt<Record<string, string | number | boolean>>(current.configurationEncrypted);
  const supplied = Object.fromEntries(Object.entries(configuration).filter(([, value]) => value !== ""));
  const channel = await prisma.notificationChannel.update({
    where: { id },
    data: { ...data, configurationEncrypted: await encrypt({ ...existing, ...supplied }) },
  });
  return NextResponse.json({ success: true, channel: { ...channel, configurationEncrypted: undefined } });
} catch (error) { return apiError(error); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; await prisma.notificationChannel.delete({ where: { id } }); return NextResponse.json({ success: true }); } catch (error) { return apiError(error); } }
