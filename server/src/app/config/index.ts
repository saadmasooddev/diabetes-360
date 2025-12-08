import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  bcryptRounds: 10,
  databaseUrl: process.env.DATABASE_URL || "",
  email: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@diabetes360.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Diabetes 360',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  accessTokenExpiresIn: Math.floor(Number(process.env.ACCESS_TOKEN_EXPIRES_IN || "0") * 60 || 30),
  refreshTokenExpiresIn: Math.floor(Number(process.env.REFRESH_TOKEN_EXPIRES_IN || "0") * 24 * 60 * 60 || 45),
  passio: {
    apiKey: process.env.PASSIO_API_KEY || '',
  },
  ai: {
    baseUrl:  'https://diabetics360-dbdrcqatcgckc2ck.eastus-01.azurewebsites.net',
  },
} as const;
