import { prisma } from "./prisma";
import { fetchProduct } from "./fetch-product";
import { detectChanges } from "./change-detection";
import { sendNotification } from "./notifications";

export async function checkBot(id: string) {
  const bot = await prisma.bot.findUnique({ where: { id }, include: { states: { where: { successful: true, confirmed: true }, orderBy: { checkedAt: "desc" }, take: 1 } } });
  if (!bot) throw new Error("Bot not found.");
  try {
    const result = await fetchProduct(bot.url, { browserMode: bot.browserMode, waitForSelector: bot.waitForSelector ?? undefined, pageLoadDelayMs: bot.pageLoadDelayMs,
      selectors: { price: bot.priceSelector ?? undefined, regularPrice: bot.regularPriceSelector ?? undefined, availability: bot.availabilitySelector ?? undefined, title: bot.titleSelector ?? undefined, image: bot.imageSelector ?? undefined } });
    const prior = bot.states[0] ?? null;
    const matching = await prisma.productState.count({ where: { botId: id, successful: true, confirmed: false, priceMinor: result.priceMinor, availability: result.availability } });
    const changed = Boolean(prior && (prior.priceMinor !== (result.priceMinor ?? null) || prior.availability !== result.availability));
    const confirmed = !changed || matching + 1 >= bot.confirmationCount;
    const state = await prisma.productState.create({ data: { botId: id, priceMinor: result.priceMinor, regularPriceMinor: result.regularPriceMinor, currency: result.currency,
      availability: result.availability, title: result.title, imageUrl: result.imageUrl, detectionMethod: result.detectionMethod, detectedPricesJson: JSON.stringify(result.detectedPrices),
      warning: result.warnings.join(" ") || null, successful: true, confirmed } });
    const events = confirmed ? detectChanges(prior, state, bot) : [];
    await prisma.$transaction([
      prisma.bot.update({ where: { id }, data: { name: result.title ?? bot.name, imageUrl: result.imageUrl ?? bot.imageUrl, lastCheckAt: new Date(), lastSuccessfulCheckAt: new Date(), lastError: null, consecutiveErrors: 0, nextCheckAt: new Date(Date.now() + bot.checkIntervalMinutes * 60_000), lockedAt: null } }),
      ...events.map((event) => prisma.notificationEvent.create({ data: { botId: id, eventType: event.type, previousStateId: prior?.id, currentStateId: state.id, message: `${event.description}: ${result.title ?? bot.name}` } })),
    ]);
    const createdEvents = await prisma.notificationEvent.findMany({ where: { currentStateId: state.id } });
    if (createdEvents.length) {
      const channels = await prisma.botNotificationChannel.findMany({ where: { botId: id, notificationChannel: { enabled: true } }, include: { notificationChannel: true } });
      for (const event of createdEvents) {
        for (const link of channels) {
          try {
            const delivery = await sendNotification(link.notificationChannel.type, link.notificationChannel.configurationEncrypted, `${event.message}\n\nOpen product: ${bot.url}`);
            await prisma.notificationDelivery.create({ data: { notificationEventId: event.id, notificationChannelId: link.notificationChannelId, successful: true, responseStatus: delivery.status, responseBody: delivery.responseBody } });
          } catch (deliveryError) {
            await prisma.notificationDelivery.create({ data: { notificationEventId: event.id, notificationChannelId: link.notificationChannelId, successful: false, error: deliveryError instanceof Error ? deliveryError.message : "Delivery failed." } });
          }
        }
      }
    }
    return { state, events, confirmed, warnings: result.warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Monitoring failed.";
    await prisma.bot.update({ where: { id }, data: { lastCheckAt: new Date(), lastError: message, consecutiveErrors: { increment: 1 }, nextCheckAt: new Date(Date.now() + bot.checkIntervalMinutes * 60_000), lockedAt: null } });
    throw error;
  }
}
