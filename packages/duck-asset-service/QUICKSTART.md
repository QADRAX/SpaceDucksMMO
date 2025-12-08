# Duck Asset Service - Quick Start Guide

## Quick Start with Docker Compose

The easiest way to get started:

```bash
# 1. Build and start the service
docker-compose up -d

# 2. Initialize the database (first time only)
docker-compose exec duck-asset-service npx prisma migrate deploy

# 3. Access the service
# - Main page: http://localhost:3000
# - Admin UI: http://localhost:3000/admin
#   Username: admin
#   Password: changeme
```

## Example Workflow

### 1. Create an Asset

```bash
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets \
  -H "Content-Type: application/json" \
  -d '{
    "key": "textures/terrain/grass",
    "displayName": "Grass Texture",
    "type": "texture",
    "category": "textures/terrain",
    "tags": ["nature", "ground"]
  }'
```

Save the returned `id` for the next steps.

### 2. Upload Files and Create a Version

```bash
# Replace {assetId} with the ID from step 1
curl -u admin:changeme -X POST http://localhost:3000/api/admin/assets/{assetId}/versions \
  -F "files=@grass.png" \
  -F "files=@grass_normal.png" \
  -F "version=1" \
  -F "status=published"
```

Save the returned version `id`.

### 3. Set as Default Version

```bash
# Replace {assetId} and {versionId} with your IDs
curl -u admin:changeme -X PATCH http://localhost:3000/api/admin/assets/{assetId}/versions/{versionId} \
  -H "Content-Type: application/json" \
  -d '{"isDefault": true}'
```

### 4. Get Manifest (Public API)

```bash
curl http://localhost:3000/api/assets/manifest/by-query?type=texture
```

### 5. Download File

```bash
# Download specific version
curl http://localhost:3000/api/assets/file/textures/terrain/grass/1/grass.png -o grass.png

# Download latest version
curl http://localhost:3000/api/assets/file/textures/terrain/grass/latest/grass.png -o grass.png
```

## Admin UI Usage

1. Navigate to http://localhost:3000/admin
2. Log in with `admin` / `changeme`
3. View dashboard with statistics
4. Click "Assets" to browse catalog
5. Click on an asset to view versions and files
6. Use buttons to:
   - Publish/deprecate versions
   - Set default version
   - View file URLs

## Testing with cURL

### List all assets
```bash
curl -u admin:changeme http://localhost:3000/api/admin/assets
```

### Filter by type
```bash
curl -u admin:changeme "http://localhost:3000/api/admin/assets?type=texture"
```

### Search assets
```bash
curl -u admin:changeme "http://localhost:3000/api/admin/assets?query=grass"
```

### Get categories
```bash
curl -u admin:changeme http://localhost:3000/api/admin/categories
```

### Get tags
```bash
curl -u admin:changeme http://localhost:3000/api/admin/tags
```

## Stopping the Service

```bash
docker-compose down
```

To also remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

## Logs

View logs:
```bash
docker-compose logs -f duck-asset-service
```

## Changing Default Credentials

Edit `docker-compose.yml` and change:
```yaml
- ASSET_ADMIN_USER=your-username
- ASSET_ADMIN_PASS=your-secure-password
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```
