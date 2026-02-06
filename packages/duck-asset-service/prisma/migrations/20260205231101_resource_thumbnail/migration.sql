-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "activeVersion" INTEGER NOT NULL DEFAULT 1,
    "thumbnailFileAssetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resource_thumbnailFileAssetId_fkey" FOREIGN KEY ("thumbnailFileAssetId") REFERENCES "FileAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Resource" ("activeVersion", "createdAt", "displayName", "id", "key", "kind", "updatedAt") SELECT "activeVersion", "createdAt", "displayName", "id", "key", "kind", "updatedAt" FROM "Resource";
DROP TABLE "Resource";
ALTER TABLE "new_Resource" RENAME TO "Resource";
CREATE UNIQUE INDEX "Resource_key_key" ON "Resource"("key");
CREATE INDEX "Resource_key_idx" ON "Resource"("key");
CREATE INDEX "Resource_kind_idx" ON "Resource"("kind");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
