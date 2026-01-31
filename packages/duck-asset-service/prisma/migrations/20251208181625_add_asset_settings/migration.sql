-- CreateTable
CREATE TABLE "AssetSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetSettings_assetId_key" ON "AssetSettings"("assetId");

-- CreateIndex
CREATE INDEX "AssetSettings_assetId_idx" ON "AssetSettings"("assetId");
