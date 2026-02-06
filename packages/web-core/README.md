# 🦆 Duck Engine Web Core

A monolithic web app that provides core web tooling for Duck Engine projects.

## Features

- ✅ **Materials Management**: Create/update material resources and immutable versions
- ✅ **File Assets**: Store uploaded blobs as FileAssets (sha256, content-type, size)
- ✅ **Bindings**: Bind material slots (albedo/normal/etc) to FileAssets
- ✅ **Admin UI**: Web-based interface for managing materials
- ✅ **REST API**: Admin API + engine-facing resolve endpoint
- ✅ **Basic Auth**: Simple authentication for admin endpoints
- ✅ **Docker Support**: Containerized deployment with persistent volumes

## Architecture

### Domain Model

- **Resource**: Logical entity (currently focused on materials)
- **ResourceVersion**: Immutable version snapshot of a Resource
- **FileAsset**: Stored blob metadata + storage path
- **ResourceBinding**: Links a ResourceVersion “slot” (e.g. `albedo`) to a FileAsset

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
  - `WEB_CORE_STORAGE_PATH` (or `ASSET_STORAGE_PATH`): Files storage root (defaults to `/data/web-core`)
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
  docker build -t duck-engine-web-core .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -v das-data:/data/web-core \
     -v das-db:/app/prisma \
     -e ASSET_ADMIN_USER=admin \
     -e ASSET_ADMIN_PASS=your-secure-password \
     -e BASE_URL=http://your-domain.com \
    --name duck-engine-web-core \
    duck-engine-web-core
   ```

3. **Initialize database** (first time only):
   ```bash
  docker exec duck-engine-web-core npx prisma migrate deploy
   ```

## API Reference

### Admin API (Protected with Basic Auth)

#### Materials

**List Materials**
```bash
GET /api/admin/resources
```

**Create Material**
```bash
POST /api/admin/resources
Content-Type: application/json

{
  "key": "materials/terrain/grass",
  "displayName": "Grass",
  "tags": ["terrain", "nature"]
}
```

**Get / Update / Delete Material**
```bash
GET    /api/admin/resources/{resourceId}
PATCH  /api/admin/resources/{resourceId}
DELETE /api/admin/resources/{resourceId}
```

**List / Create Versions**
```bash
GET  /api/admin/resources/{resourceId}/versions
POST /api/admin/resources/{resourceId}/versions
```

Version creation is `multipart/form-data` and supports uploading files for named slots.

### Engine API (No Authentication)

**Resolve a material to concrete file URLs**
```bash
GET /api/engine/resources/resolve?key=materials/terrain/grass&version=latest
```

Response includes the resolved Resource + version + bindings, where each file contains a stable URL like:

- `GET /api/files/{fileId}`

### Files API (No Authentication)

**Download a FileAsset by id**
```bash
GET /api/files/{fileId}
```

## File Storage Structure

Files are stored on the filesystem at:
```
/data/web-core/files/{fileId}/{fileName}
```

## Authentication

Admin endpoints use HTTP Basic Authentication:

Example (materials):

```bash
curl -u admin:password http://localhost:3000/api/admin/resources
```

Or in browser, when accessing `/admin`, you'll be prompted for credentials.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database location |
| `WEB_CORE_STORAGE_PATH` | `/data/web-core` | Storage root for file blobs |
| `ASSET_STORAGE_PATH` | *(deprecated)* | Back-compat alias for `WEB_CORE_STORAGE_PATH` |
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

## Version Status

- `draft`: Work in progress
- `published`: Used by engine resolve
- `deprecated`: Marked for removal

## Best Practices

1. **Keys**: Use hierarchical paths (e.g., `materials/terrain/grass`)
2. **Versioning**: Create new versions for file changes; keep versions immutable
3. **Publishing**: Only publish tested versions used by the engine
4. **Tags**: Add descriptive tags for discoverability

## Troubleshooting

**Database locked error**:
- Ensure only one process accesses the SQLite database
- In Docker, use a volume for `/app/prisma`

**File not found errors**:
- Verify `WEB_CORE_STORAGE_PATH` is correct
- Check file permissions in Docker volumes
- Ensure files were uploaded successfully

**Authentication fails**:
- Verify `ASSET_ADMIN_USER` and `ASSET_ADMIN_PASS` environment variables
- Check Basic Auth header format

## License

MIT License - Part of Duck Engine project

## Contributing

This service is part of the Duck Engine monorepo. Follow the monorepo contribution guidelines.
