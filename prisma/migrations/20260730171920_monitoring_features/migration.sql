-- AlterTable
ALTER TABLE "ProductState" ADD COLUMN "variantValue" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bot" (
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
    "notifyOnHistoricalLow" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnProductChange" BOOLEAN NOT NULL DEFAULT false,
    "variantName" TEXT,
    "variantSelector" TEXT,
    "variantValue" TEXT,
    "minimumChangeMinor" INTEGER NOT NULL DEFAULT 1,
    "minimumChangePercent" REAL NOT NULL DEFAULT 0,
    "confirmationCount" INTEGER NOT NULL DEFAULT 2,
    "notificationCooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bot" ("availabilitySelector", "browserMode", "checkIntervalMinutes", "confirmationCount", "consecutiveErrors", "createdAt", "customHeadersJson", "customUserAgent", "enabled", "hostname", "id", "imageSelector", "imageUrl", "inStockText", "lastCheckAt", "lastError", "lastSuccessfulCheckAt", "lockedAt", "minimumChangeMinor", "minimumChangePercent", "name", "nextCheckAt", "notificationCooldownMinutes", "notifyOnAvailable", "notifyOnPriceDrop", "notifyOnPriceIncrease", "notifyOnTargetPrice", "notifyOnUnavailable", "outOfStockText", "pageLoadDelayMs", "priceSelector", "regularPriceSelector", "targetPriceMinor", "titleSelector", "updatedAt", "url", "waitForSelector") SELECT "availabilitySelector", "browserMode", "checkIntervalMinutes", "confirmationCount", "consecutiveErrors", "createdAt", "customHeadersJson", "customUserAgent", "enabled", "hostname", "id", "imageSelector", "imageUrl", "inStockText", "lastCheckAt", "lastError", "lastSuccessfulCheckAt", "lockedAt", "minimumChangeMinor", "minimumChangePercent", "name", "nextCheckAt", "notificationCooldownMinutes", "notifyOnAvailable", "notifyOnPriceDrop", "notifyOnPriceIncrease", "notifyOnTargetPrice", "notifyOnUnavailable", "outOfStockText", "pageLoadDelayMs", "priceSelector", "regularPriceSelector", "targetPriceMinor", "titleSelector", "updatedAt", "url", "waitForSelector" FROM "Bot";
DROP TABLE "Bot";
ALTER TABLE "new_Bot" RENAME TO "Bot";
CREATE INDEX "Bot_enabled_nextCheckAt_idx" ON "Bot"("enabled", "nextCheckAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
