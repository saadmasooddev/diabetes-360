import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Diabetes 360 API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Diabetes 360 health management application',
      contact: {
        name: 'API Support',
      },
    },
    
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'number',
              example: 400,
              description: 'HTTP status code',
            },
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
              description: 'Error message description',
            },
            data: {
              description: 'Error response data - null for most errors, empty array [] for array endpoints',
              oneOf: [
                { type: 'null' },
                { type: 'array', items: {} },
                { type: 'object' },
              ],
              example: null,
            },
          },
          required: ['status', 'success', 'message'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'number',
              example: 200,
              description: 'HTTP status code',
            },
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              description: 'Response data payload',
            },
            message: {
              type: 'string',
              example: 'Operation successful',
              description: 'Success message',
            },
          },
          required: ['status', 'success', 'message'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'uuid-string',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            fullName: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            emailVerified: {
              type: 'boolean',
              example: false,
            },
            provider: {
              type: 'string',
              example: 'manual',
            },
            providerId: {
              type: 'string',
              nullable: true,
            },
            avatar: {
              type: 'string',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: ['customer', 'admin', 'physician'],
              example: 'customer',
            },
            tier: {
              type: 'string',
              enum: ['free', 'paid'],
              example: 'free',
            },
            isActive: {
              type: 'boolean',
              example: true,
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
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            tokens: {
              $ref: '#/components/schemas/TokenPair',
            },
          },
        },
        HealthMetric: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'uuid-string',
            },
            userId: {
              type: 'string',
              example: 'uuid-string',
            },
            bloodSugar: {
              type: 'string',
              nullable: true,
              example: '120',
            },
            steps: {
              type: 'integer',
              nullable: true,
              example: 5000,
            },
            waterIntake: {
              type: 'string',
              nullable: true,
              example: '2.5',
            },
            recordedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FreeTierLimits: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'uuid-string',
            },
            glucoseLimit: {
              type: 'integer',
              example: 2,
            },
            stepsLimit: {
              type: 'integer',
              example: 2,
            },
            waterLimit: {
              type: 'integer',
              example: 2,
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
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'User',
        description: 'User profile management endpoints',
      },
      {
        name: 'Health Metrics',
        description: 'Health metrics tracking and management endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints for user management',
      },
      {
        name: 'Settings',
        description: 'System settings and configuration endpoints',
      },
    ],
  },
  apis: [
    './server/src/modules/**/routes/*.routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Diabetes 360 API Documentation',
    explorer: true
  }));


}

