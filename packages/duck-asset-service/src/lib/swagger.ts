import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Duck Engine Web Core API',
      version: '1.0.0',
      description: 'Core web API for Duck Engine (resource-first materials + file assets; scenes/editor next)',
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
        name: 'Admin',
        description: 'Administrative endpoints',
      },
      {
        name: 'Materials',
        description: 'Material resource endpoints',
      },
      {
        name: 'Files',
        description: 'FileAsset serving endpoints',
      },
    ],
    paths: {},
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
