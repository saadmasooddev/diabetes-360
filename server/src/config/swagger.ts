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
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
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
            paymentType: {
              type: 'string',
              enum: ['free', 'monthly', 'annual'],
              example: 'free',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            profileComplete: {
              type: 'boolean',
              example: false,
              description: 'Indicates if the user profile is complete (for customer role)',
            },
            profileData: {
              oneOf: [
                { $ref: '#/components/schemas/CustomerData' },
                { $ref: '#/components/schemas/PhysicianData' },
              ],
              nullable: true,
              description: 'User profile data - CustomerData for customers, PhysicianData for physicians, null if profile not complete',
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
        CustomerData: {
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
            gender: {
              type: 'string',
              enum: ['male', 'female'],
              example: 'male',
            },
            birthday: {
              type: 'string',
              format: 'date-time',
              example: '1990-01-15T00:00:00Z',
            },
            diagnosisDate: {
              type: 'string',
              format: 'date-time',
              example: '2020-05-10T00:00:00Z',
            },
            weight: {
              type: 'string',
              example: '70',
              description: 'Weight in kg as string',
            },
            height: {
              type: 'string',
              example: '175',
              description: 'Height in cm as string',
            },
            diabetesType: {
              type: 'string',
              enum: ['type1', 'type2', 'gestational', 'prediabetes'],
              example: 'type2',
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
        PhysicianData: {
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
            specialtyId: {
              type: 'string',
              example: 'uuid-string',
            },
            specialty: {
              type: 'string',
              example: 'Endocrinology',
              description: 'Specialty name (from physician_specialties table)',
              nullable: true,
            },
            practiceStartDate: {
              type: 'string',
              format: 'date-time',
              example: '2010-06-01T00:00:00Z',
            },
            consultationFee: {
              type: 'string',
              example: '1500.00',
              description: 'Consultation fee as string',
            },
            imageUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/image.jpg',
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
            heartRate: {
              type: 'integer',
              nullable: true,
              example: 72,
              description: 'Heart rate in beats per minute (BPM). Only available for paid users.',
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
        PhysicianLocation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'uuid-string',
            },
            physicianId: {
              type: 'string',
              example: 'uuid-string',
            },
            locationName: {
              type: 'string',
              example: 'Main Clinic',
            },
            address: {
              type: 'string',
              nullable: true,
              example: '123 Main Street',
            },
            city: {
              type: 'string',
              nullable: true,
              example: 'Karachi',
            },
            state: {
              type: 'string',
              nullable: true,
              example: 'Sindh',
            },
            country: {
              type: 'string',
              nullable: true,
              example: 'Pakistan',
            },
            postalCode: {
              type: 'string',
              nullable: true,
              example: '75500',
            },
            latitude: {
              type: 'string',
              example: '24.8607',
            },
            longitude: {
              type: 'string',
              example: '67.0011',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active',
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
          required: ['id', 'physicianId', 'locationName', 'latitude', 'longitude', 'status'],
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
      {
        name: 'Physician Locations',
        description: 'Physician location management endpoints',
      },
      {
        name: 'Food Scanner',
        description: 'Food Scanner API integration endpoints for food scanning and nutrition analysis',
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

