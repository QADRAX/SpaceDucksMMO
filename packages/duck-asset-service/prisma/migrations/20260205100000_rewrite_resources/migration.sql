-- WARNING: destructive migration (intended)
-- This migration replaces the old Asset/AssetVersion/AssetFile schema
-- with a new Resource/ResourceVersion model and single-file FileAsset storage.

PRAGMA foreign_keys=off;

DROP TABLE IF EXISTS "AssetFile";
DROP TABLE IF EXISTS "AssetVersion";
DROP TABLE IF EXISTS "Asset";
DROP TABLE IF EXISTS "AssetSettings";

DROP TABLE IF EXISTS "ResourceBinding";
DROP TABLE IF EXISTS "ResourceVersion";
DROP TABLE IF EXISTS "Resource";
DROP TABLE IF EXISTS "FileAsset";

CREATE TABLE "FileAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "FileAsset_sha256_idx" ON "FileAsset"("sha256");

CREATE TABLE "Resource" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "isArchived" BOOLEAN NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX "Resource_key_key" ON "Resource"("key");
CREATE INDEX "Resource_key_idx" ON "Resource"("key");
CREATE INDEX "Resource_kind_idx" ON "Resource"("kind");
CREATE INDEX "Resource_isArchived_idx" ON "Resource"("isArchived");

CREATE TABLE "ResourceVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resourceId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isDefault" BOOLEAN NOT NULL DEFAULT 0,
  "componentType" TEXT NOT NULL,
  "componentData" TEXT NOT NULL DEFAULT '{}',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResourceVersion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ResourceVersion_resourceId_version_key" ON "ResourceVersion"("resourceId", "version");
CREATE INDEX "ResourceVersion_resourceId_idx" ON "ResourceVersion"("resourceId");
CREATE INDEX "ResourceVersion_status_idx" ON "ResourceVersion"("status");
CREATE INDEX "ResourceVersion_isDefault_idx" ON "ResourceVersion"("isDefault");
CREATE INDEX "ResourceVersion_componentType_idx" ON "ResourceVersion"("componentType");

CREATE TABLE "ResourceBinding" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resourceVersionId" TEXT NOT NULL,
  "slot" TEXT NOT NULL,
  "fileAssetId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResourceBinding_resourceVersionId_fkey" FOREIGN KEY ("resourceVersionId") REFERENCES "ResourceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ResourceBinding_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ResourceBinding_resourceVersionId_slot_key" ON "ResourceBinding"("resourceVersionId", "slot");
CREATE INDEX "ResourceBinding_resourceVersionId_idx" ON "ResourceBinding"("resourceVersionId");
CREATE INDEX "ResourceBinding_fileAssetId_idx" ON "ResourceBinding"("fileAssetId");
CREATE INDEX "ResourceBinding_slot_idx" ON "ResourceBinding"("slot");

PRAGMA foreign_keys=on;
