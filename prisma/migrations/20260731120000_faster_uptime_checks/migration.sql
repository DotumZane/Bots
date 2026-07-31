ALTER TABLE "Bot" ADD COLUMN "checkIntervalSeconds" INTEGER NOT NULL DEFAULT 1800;
UPDATE "Bot" SET "checkIntervalSeconds" = "checkIntervalMinutes" * 60;
