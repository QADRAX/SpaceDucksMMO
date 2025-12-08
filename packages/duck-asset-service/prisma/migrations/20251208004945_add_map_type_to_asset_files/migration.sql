-- AlterTable
ALTER TABLE "AssetFile" ADD COLUMN "mapType" TEXT;

-- CreateIndex
CREATE INDEX "AssetFile_mapType_idx" ON "AssetFile"("mapType");
