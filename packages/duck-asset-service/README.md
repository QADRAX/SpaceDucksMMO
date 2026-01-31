# 🦆 Duck Asset Service (DAS)

A monolithic web service for managing, versioning, and distributing assets for Duck Engine projects.

## Features

- ✅ **Asset Management**: Create, update, and organize reusable assets
- ✅ **Version Control**: Immutable versioning with published/draft/deprecated states
- ✅ **File Storage**: Filesystem-based storage with hash verification
- ✅ **Admin UI**: Web-based interface for catalog management
- ✅ **REST API**: Full admin and public APIs
- ✅ **Basic Auth**: Simple authentication for admin endpoints
- ✅ **Docker Support**: Containerized deployment with persistent volumes

## Architecture

### Domain Model

- **Asset**: Logical resource (texture, audio, map, etc.)
- **AssetVersion**: Immutable version of an asset with files
- **AssetFile**: Physical file metadata (size, hash, content type)

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js
- **Database**: SQLite with Prisma ORM
- **Storage**: Filesystem (volume-mounted in Docker)
- **Auth**: HTTP Basic Authentication

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` to configure:
   - `DATABASE_URL`: SQLite database path
   - `ASSET_STORAGE_PATH`: Where asset files are stored
   - `ASSET_ADMIN_USER`: Admin username
   - `ASSET_ADMIN_PASS`: Admin password

3. **Initialize database**:
   ```bash
   npx prisma migrate dev
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Main page: http://localhost:3000
   - Admin UI: http://localhost:3000/admin (requires Basic Auth)

### Docker Deployment

1. **Build the image**:
   ```bash
   docker build -t duck-asset-service .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -v das-data:/data/assets \
     -v das-db:/app/prisma \
     -e ASSET_ADMIN_USER=admin \
     -e ASSET_ADMIN_PASS=your-secure-password \
     -e BASE_URL=http://your-domain.com \
     --name das \
     duck-asset-service
   ```

3. **Initialize database** (first time only):
   ```bash
   docker exec das npx prisma migrate deploy
   ```

## API Reference

### Admin API (Protected with Basic Auth)

#### Assets

**List Assets**
```bash
GET /api/admin/assets?type=texture&category=terrain&page=1&limit=20
```

**Create Asset**
```bash
POST /api/admin/assets
Content-Type: application/json

{
  "key": "textures/terrain/grass",
  "displayName": "Grass Texture",
  "type": "texture",
  "category": "textures/terrain",
  "tags": ["nature", "ground"]
}
```

**Get Asset**
```bash
GET /api/admin/assets/{assetId}
```

**Update Asset**
```bash
PATCH /api/admin/assets/{assetId}
Content-Type: application/json

{
  "displayName": "Updated Name",
  "tags": ["new", "tags"]
}
```

**Archive Asset**
```bash
DELETE /api/admin/assets/{assetId}
```

#### Versions

**List Versions**
```bash
GET /api/admin/assets/{assetId}/versions
```

**Create Version with Files**
```bash
POST /api/admin/assets/{assetId}/versions
Content-Type: multipart/form-data

files[]: <file1>
files[]: <file2>
version: "2"
status: "draft"
notes: "Updated textures"
```

**Get Version**
```bash
GET /api/admin/assets/{assetId}/versions/{versionId}
```

**Update Version**
```bash
PATCH /api/admin/assets/{assetId}/versions/{versionId}
Content-Type: application/json

{
  "status": "published",
  "isDefault": true
}
```

**Deprecate Version**
```bash
DELETE /api/admin/assets/{assetId}/versions/{versionId}
```

#### Taxonomy

**Get Categories**
```bash
GET /api/admin/categories
```

**Get Tags**
```bash
GET /api/admin/tags?query=nature
```

### Public API (No Authentication)

**Get Manifest**
```bash
GET /api/assets/manifest/by-query?type=texture&category=terrain
```

Response:
```json
{
  "data": [
    {
      "assetKey": "textures/terrain/grass",
      "displayName": "Grass Texture",
      "type": "texture",
      "category": "textures/terrain",
      "tags": ["nature", "ground"],
      "version": "2",
      "files": [
        {
          "fileName": "grass.png",
          "url": "http://localhost:3000/api/assets/file/textures/terrain/grass/2/grass.png",
          "size": 102400,
          "hash": "sha256:abc123...",
          "contentType": "image/png"
        }
      ]
    }
  ],
  "count": 1
}
```

**Download File (Specific Version)**
```bash
GET /api/assets/file/{assetKey}/{version}/{fileName}
```

**Download File (Latest Version)**
```bash
GET /api/assets/file/{assetKey}/latest/{fileName}
```

## File Storage Structure

Assets are stored on the filesystem at:
```
/data/assets/{assetKey}/{version}/{fileName}
```

Example:
```
/data/assets/
  └── textures/
      └── terrain/
          └── grass/
              ├── 1/
              │   └── grass.png
              └── 2/
                  ├── grass.png
                  └── grass_normal.png
```

## Authentication

Admin endpoints use HTTP Basic Authentication:

```bash
curl -u admin:password http://localhost:3000/api/admin/assets
```

Or in browser, when accessing `/admin`, you'll be prompted for credentials.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database location |
| `ASSET_STORAGE_PATH` | `/data/assets` | Asset file storage path |
| `ASSET_ADMIN_USER` | `admin` | Admin username |
| `ASSET_ADMIN_PASS` | `changeme` | Admin password |
| `BASE_URL` | `http://localhost:3000` | Public base URL for file URLs |
| `PORT` | `3000` | Server port |

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Prisma commands
npm run prisma:migrate    # Create and apply migrations
npm run prisma:generate   # Generate Prisma client
npm run prisma:studio     # Open Prisma Studio
```

## Asset Types

Supported asset types:
- `texture`: Image textures
- `sprite_sheet`: Sprite atlases
- `audio`: Sound effects and music
- `map`: Game maps
- `prefab`: Prefabs/blueprints
- `shader`: Shader code
- `script`: Game scripts
- `other`: Other asset types

## Version Status

- `draft`: Work in progress, not publicly available
- `published`: Available via public API
- `deprecated`: Marked for removal, not recommended

## Best Practices

1. **Asset Keys**: Use hierarchical paths (e.g., `textures/terrain/grass`)
2. **Versioning**: Create new versions for file changes, don't modify existing
3. **Default Version**: Mark stable versions as default for "latest" access
4. **Publishing**: Only publish tested and approved versions
5. **Categories**: Use consistent category hierarchies
6. **Tags**: Add descriptive tags for better searchability

## Troubleshooting

**Database locked error**:
- Ensure only one process accesses the SQLite database
- In Docker, use a volume for `/app/prisma`

**File not found errors**:
- Verify `ASSET_STORAGE_PATH` is correct
- Check file permissions in Docker volumes
- Ensure files were uploaded successfully

**Authentication fails**:
- Verify `ASSET_ADMIN_USER` and `ASSET_ADMIN_PASS` environment variables
- Check Basic Auth header format

## License

MIT License - Part of Duck Engine project

## Contributing

This service is part of the Duck Engine monorepo. Follow the monorepo contribution guidelines.
