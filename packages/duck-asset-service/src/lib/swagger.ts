import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Duck Engine Web Core API',
      version: '1.0.0',
      description: 'Core web API for Duck Engine (assets today; scenes/editor next)',
      contact: {
        name: 'SpaceDucks Team',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Assets',
        description: 'Asset management endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
      {
        name: 'Files',
        description: 'File serving endpoints',
      },
    ],
    paths: {
      '/api/assets/file/{assetKey}/{version}/{fileName}': {
        get: {
          tags: ['Files'],
          summary: 'Download asset file',
          description: "Download a specific file from an asset version. Use 'latest' as version to get the default/most recent published version.",
          parameters: [
            {
              in: 'path',
              name: 'assetKey',
              required: true,
              schema: { type: 'string' },
              description: 'Asset key (may contain slashes)',
              example: 'metal-grid-01',
            },
            {
              in: 'path',
              name: 'version',
              required: true,
              schema: { type: 'string' },
              description: "Version number or 'latest'",
              example: '1.0.0',
            },
            {
              in: 'path',
              name: 'fileName',
              required: true,
              schema: { type: 'string' },
              description: 'File name',
              example: 'albedo.png',
            },
          ],
          responses: {
            '200': {
              description: 'File content',
              content: {
                'image/png': {
                  schema: { type: 'string', format: 'binary' },
                },
                'image/jpeg': {
                  schema: { type: 'string', format: 'binary' },
                },
                'application/octet-stream': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
              headers: {
                'Content-Type': {
                  schema: { type: 'string' },
                  description: 'MIME type of the file',
                },
                'Content-Length': {
                  schema: { type: 'integer' },
                  description: 'File size in bytes',
                },
                'Cache-Control': {
                  schema: { type: 'string' },
                  description: 'Cache directives',
                },
                ETag: {
                  schema: { type: 'string' },
                  description: 'Entity tag for cache validation',
                },
              },
            },
            '400': {
              description: 'Invalid path format',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Asset, version, or file not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Asset: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier',
            },
            key: {
              type: 'string',
              description: 'Unique key for the asset',
              example: 'metal-grid-01',
            },
            displayName: {
              type: 'string',
              description: 'Human-readable name',
              example: 'Metal Grid Material',
            },
            type: {
              type: 'string',
              enum: ['material', 'texture'],
              description: 'Type of asset',
            },
            category: {
              type: 'string',
              nullable: true,
              description: 'Category for organization',
              example: 'metals',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for searching and filtering',
              example: ['metal', 'grid', 'industrial'],
            },
            isArchived: {
              type: 'boolean',
              description: 'Whether the asset is archived',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AssetVersion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            assetId: {
              type: 'string',
              format: 'uuid',
            },
            version: {
              type: 'string',
              example: '1.0.0',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
            },
            isDefault: {
              type: 'boolean',
            },
            notes: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AssetFile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            fileName: {
              type: 'string',
              example: 'albedo.png',
            },
            fileSize: {
              type: 'integer',
              description: 'File size in bytes',
            },
            hash: {
              type: 'string',
              description: 'SHA-256 hash of the file',
            },
            contentType: {
              type: 'string',
              example: 'image/png',
            },
            mapType: {
              type: 'string',
              nullable: true,
              enum: ['albedo', 'normal', 'roughness', 'metallic', 'ao', 'height', 'emission'],
              description: 'Type of PBR map (for materials)',
            },
          },
        },
        CreateAssetRequest: {
          type: 'object',
          required: ['key', 'displayName', 'type'],
          properties: {
            key: {
              type: 'string',
              description: 'Unique key for the asset',
            },
            displayName: {
              type: 'string',
              description: 'Human-readable name',
            },
            type: {
              type: 'string',
              enum: ['material', 'texture'],
            },
            category: {
              type: 'string',
              nullable: true,
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
