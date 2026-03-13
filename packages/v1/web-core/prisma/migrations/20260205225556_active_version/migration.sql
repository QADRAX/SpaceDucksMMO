/*
  Warnings:

  - You are about to drop the column `isArchived` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `ResourceVersion` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ResourceVersion` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "activeVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Resource" ("createdAt", "displayName", "id", "key", "kind", "updatedAt") SELECT "createdAt", "displayName", "id", "key", "kind", "updatedAt" FROM "Resource";
DROP TABLE "Resource";
ALTER TABLE "new_Resource" RENAME TO "Resource";
CREATE UNIQUE INDEX "Resource_key_key" ON "Resource"("key");
CREATE INDEX "Resource_key_idx" ON "Resource"("key");
CREATE INDEX "Resource_kind_idx" ON "Resource"("kind");
CREATE TABLE "new_ResourceVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "componentType" TEXT NOT NULL,
    "componentData" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceVersion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResourceVersion" ("componentData", "componentType", "createdAt", "id", "resourceId", "version") SELECT "componentData", "componentType", "createdAt", "id", "resourceId", "version" FROM "ResourceVersion";
DROP TABLE "ResourceVersion";
ALTER TABLE "new_ResourceVersion" RENAME TO "ResourceVersion";
CREATE INDEX "ResourceVersion_resourceId_idx" ON "ResourceVersion"("resourceId");
CREATE INDEX "ResourceVersion_componentType_idx" ON "ResourceVersion"("componentType");
CREATE UNIQUE INDEX "ResourceVersion_resourceId_version_key" ON "ResourceVersion"("resourceId", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
