# Duck Asset Service - API Examples

This file contains example requests for testing the Duck Asset Service API.

## Setup

Replace these variables in the examples below:
- `BASE_URL`: Your service URL (e.g., `http://localhost:3000`)
- `ADMIN_USER`: Your admin username (default: `admin`)
- `ADMIN_PASS`: Your admin password (default: `changeme`)
- `{assetId}`: Replace with actual asset ID
- `{versionId}`: Replace with actual version ID

## Health Check

```bash
curl http://localhost:3000/api/health
```

---

## Admin API Examples (Require Basic Auth)

### Assets

#### 1. Create a Texture Asset

```bash
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets \
  -H "Content-Type: application/json" \
  -d '{
    "key": "textures/terrain/grass",
    "displayName": "Grass Texture",
    "type": "texture",
    "category": "textures/terrain",
    "tags": ["nature", "ground", "grass"]
  }'
```

#### 2. Create an Audio Asset

```bash
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets \
  -H "Content-Type: application/json" \
  -d '{
    "key": "audio/music/background1",
    "displayName": "Background Music Track 1",
    "type": "audio",
    "category": "audio/music",
    "tags": ["music", "background", "ambient"]
  }'
```

#### 3. List All Assets

```bash
curl -u admin:changeme http://localhost:3000/api/admin/assets
```

#### 4. Filter Assets by Type

```bash
curl -u admin:changeme "http://localhost:3000/api/admin/assets?type=texture"
```

#### 5. Filter Assets by Category

```bash
curl -u admin:changeme "http://localhost:3000/api/admin/assets?category=textures/terrain"
```

#### 6. Search Assets

```bash
curl -u admin:changeme "http://localhost:3000/api/admin/assets?query=grass"
```

#### 7. Get Specific Asset

```bash
curl -u admin:changeme http://localhost:3000/api/admin/assets/{assetId}
```

#### 8. Update Asset

```bash
curl -u admin:changeme -X PATCH http://localhost:3000/api/admin/assets/{assetId} \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Grass Texture",
    "tags": ["nature", "ground", "grass", "green"]
  }'
```

#### 9. Archive Asset

```bash
curl -u admin:changeme -X DELETE http://localhost:3000/api/admin/assets/{assetId}
```

---

### Versions

#### 10. Upload Files and Create Version (Single File)

```bash
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets/{assetId}/versions \
  -F "files=@./path/to/grass.png" \
  -F "version=1" \
  -F "status=draft" \
  -F "notes=Initial version"
```

#### 11. Upload Multiple Files

```bash
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets/{assetId}/versions \
  -F "files=@./path/to/grass_diffuse.png" \
  -F "files=@./path/to/grass_normal.png" \
  -F "files=@./path/to/grass_specular.png" \
  -F "version=2" \
  -F "status=draft"
```

#### 12. Auto-Generate Version Number

```bash
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets/{assetId}/versions \
  -F "files=@./path/to/file.png" \
  -F "status=draft"
```

#### 13. List All Versions for an Asset

```bash
curl -u admin:changeme http://localhost:3000/api/admin/assets/{assetId}/versions
```

#### 14. Get Specific Version Details

```bash
curl -u admin:changeme http://localhost:3000/api/admin/assets/{assetId}/versions/{versionId}
```

#### 15. Publish a Version

```bash
curl -u admin:changeme -X PATCH http://localhost:3000/api/admin/assets/{assetId}/versions/{versionId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'
```

#### 16. Set Version as Default

```bash
curl -u admin:changeme -X PATCH http://localhost:3000/api/admin/assets/{assetId}/versions/{versionId} \
  -H "Content-Type: application/json" \
  -d '{
    "isDefault": true
  }'
```

#### 17. Publish and Set as Default

```bash
curl -u admin:changeme -X PATCH http://localhost:3000/api/admin/assets/{assetId}/versions/{versionId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "isDefault": true
  }'
```

#### 18. Deprecate a Version

```bash
curl -u admin:changeme -X DELETE http://localhost:3000/api/admin/assets/{assetId}/versions/{versionId}
```

---

### Taxonomy

#### 19. Get All Categories

```bash
curl -u admin:changeme http://localhost:3000/api/admin/categories
```

#### 20. Get All Tags

```bash
curl -u admin:changeme http://localhost:3000/api/admin/tags
```

#### 21. Search Tags

```bash
curl -u admin:changeme "http://localhost:3000/api/admin/tags?query=nature"
```

---

## Public API Examples (No Authentication Required)

### Manifests

#### 22. Get All Published Assets

```bash
curl http://localhost:3000/api/assets/manifest/by-query
```

#### 23. Get Textures Only

```bash
curl "http://localhost:3000/api/assets/manifest/by-query?type=texture"
```

#### 24. Get Assets by Category

```bash
curl "http://localhost:3000/api/assets/manifest/by-query?category=textures/terrain"
```

#### 25. Get Assets by Tag

```bash
curl "http://localhost:3000/api/assets/manifest/by-query?tag=nature"
```

#### 26. Combined Filters

```bash
curl "http://localhost:3000/api/assets/manifest/by-query?type=texture&category=textures&tag=nature"
```

---

### File Downloads

#### 27. Download Specific Version

```bash
curl http://localhost:3000/api/assets/file/textures/terrain/grass/1/grass.png \
  -o grass_v1.png
```

#### 28. Download Latest Version

```bash
curl http://localhost:3000/api/assets/file/textures/terrain/grass/latest/grass.png \
  -o grass_latest.png
```

#### 29. Download with Headers

```bash
curl -I http://localhost:3000/api/assets/file/textures/terrain/grass/latest/grass.png
```

---

## Complete Workflow Example

```bash
# 1. Create asset
ASSET_RESPONSE=$(curl -s -u admin:changeme -X POST http://localhost:3000/api/admin/assets \
  -H "Content-Type: application/json" \
  -d '{
    "key": "textures/test/example",
    "displayName": "Example Texture",
    "type": "texture",
    "category": "textures/test",
    "tags": ["test", "example"]
  }')

ASSET_ID=$(echo $ASSET_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created asset: $ASSET_ID"

# 2. Upload version
VERSION_RESPONSE=$(curl -s -u admin:changeme -X POST http://localhost:3000/api/admin/assets/$ASSET_ID/versions \
  -F "files=@./test.png" \
  -F "version=1" \
  -F "status=published")

VERSION_ID=$(echo $VERSION_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created version: $VERSION_ID"

# 3. Set as default
curl -u admin:changeme -X PATCH http://localhost:3000/api/admin/assets/$ASSET_ID/versions/$VERSION_ID \
  -H "Content-Type: application/json" \
  -d '{"isDefault": true}'

echo "Set as default version"

# 4. Get manifest
curl http://localhost:3000/api/assets/manifest/by-query?type=texture

# 5. Download file
curl http://localhost:3000/api/assets/file/textures/test/example/latest/test.png \
  -o downloaded.png

echo "Workflow complete!"
```

---

## PowerShell Examples (Windows)

### Create Asset
```powershell
$credentials = "admin:changeme"
$base64Creds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($credentials))

$headers = @{
    "Authorization" = "Basic $base64Creds"
    "Content-Type" = "application/json"
}

$body = @{
    key = "textures/terrain/grass"
    displayName = "Grass Texture"
    type = "texture"
    category = "textures/terrain"
    tags = @("nature", "ground")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/assets" -Method Post -Headers $headers -Body $body
```

### Upload Version
```powershell
$credentials = "admin:changeme"
$base64Creds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($credentials))

$headers = @{
    "Authorization" = "Basic $base64Creds"
}

$form = @{
    files = Get-Item -Path ".\grass.png"
    version = "1"
    status = "published"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/assets/{assetId}/versions" -Method Post -Headers $headers -Form $form
```

---

## Notes

- All admin endpoints require Basic Authentication
- Public endpoints (`/api/assets/*`) are accessible without authentication
- File uploads use `multipart/form-data` encoding
- Versions are immutable - create a new version to update files
- Only `published` versions are included in public manifests
- The `latest` file path uses the version marked as `isDefault` or the most recent published version
