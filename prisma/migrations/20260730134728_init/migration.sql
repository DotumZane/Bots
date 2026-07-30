-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "imageUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "checkIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "nextCheckAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckAt" DATETIME,
    "lastSuccessfulCheckAt" DATETIME,
    "lastError" TEXT,
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "browserMode" BOOLEAN NOT NULL DEFAULT false,
    "pageLoadDelayMs" INTEGER NOT NULL DEFAULT 0,
    "waitForSelector" TEXT,
    "customUserAgent" TEXT,
    "customHeadersJson" TEXT,
    "priceSelector" TEXT,
    "regularPriceSelector" TEXT,
    "availabilitySelector" TEXT,
    "titleSelector" TEXT,
    "imageSelector" TEXT,
    "inStockText" TEXT,
    "outOfStockText" TEXT,
    "notifyOnPriceDrop" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnTargetPrice" BOOLEAN NOT NULL DEFAULT false,
    "targetPriceMinor" INTEGER,
    "notifyOnAvailable" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnPriceIncrease" BOOLEAN NOT NULL DEFAULT false,
    "minimumChangeMinor" INTEGER NOT NULL DEFAULT 1,
    "minimumChangePercent" REAL NOT NULL DEFAULT 0,
    "confirmationCount" INTEGER NOT NULL DEFAULT 2,
    "notificationCooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "priceMinor" INTEGER,
    "regularPriceMinor" INTEGER,
    "currency" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "title" TEXT,
    "imageUrl" TEXT,
    "detectionMethod" TEXT NOT NULL,
    "detectedPricesJson" TEXT,
    "warning" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "successful" BOOLEAN NOT NULL DEFAULT true,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProductState_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configurationEncrypted" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BotNotificationChannel" (
    "botId" TEXT NOT NULL,
    "notificationChannelId" TEXT NOT NULL,

    PRIMARY KEY ("botId", "notificationChannelId"),
    CONSTRAINT "BotNotificationChannel_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BotNotificationChannel_notificationChannelId_fkey" FOREIGN KEY ("notificationChannelId") REFERENCES "NotificationChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousStateId" TEXT,
    "currentStateId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationEvent_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationEvent_previousStateId_fkey" FOREIGN KEY ("previousStateId") REFERENCES "ProductState" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NotificationEvent_currentStateId_fkey" FOREIGN KEY ("currentStateId") REFERENCES "ProductState" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationEventId" TEXT NOT NULL,
    "notificationChannelId" TEXT NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "error" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDelivery_notificationEventId_fkey" FOREIGN KEY ("notificationEventId") REFERENCES "NotificationEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationDelivery_notificationChannelId_fkey" FOREIGN KEY ("notificationChannelId") REFERENCES "NotificationChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Bot_enabled_nextCheckAt_idx" ON "Bot"("enabled", "nextCheckAt");

-- CreateIndex
CREATE INDEX "ProductState_botId_checkedAt_idx" ON "ProductState"("botId", "checkedAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_eventType_createdAt_idx" ON "NotificationEvent"("eventType", "createdAt");
