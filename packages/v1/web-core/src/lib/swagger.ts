import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Duck Engine Web Core API',
      version: '1.0.0',
      description:
        'Core web API for Duck Engine (resource-first materials + file assets; scenes/editor next)',
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
  },
  apis: ['./src/app/api/**/route.ts', './src/lib/openapi/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
