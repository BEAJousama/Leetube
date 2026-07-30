import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application Configuration
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL!,

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // External APIs
  apis: {
    tmdb: {
      apiKey: process.env.TMDB_API_KEY!,
      baseUrl: 'https://api.themoviedb.org/3',
      imageBaseUrl: 'https://image.tmdb.org/t/p',
      personImgUrl: 'https://image.tmdb.org/t/p',
    },
    opensubtitles: {
      apiKey: process.env.OPENSUBTITLES_API_KEY || '',
      baseUrl: 'https://api.opensubtitles.org/api/v1',
      searchSubtitles: '/subtitles/search',
      downloadSubtitle: '/subtitles/download',
      userAgent: 'hypertube',
    },
  },

  // OAuth Configuration
  oauth: {
    school42: {
      clientId: process.env.OAUTH_42_CLIENT_ID!,
      clientSecret: process.env.OAUTH_42_CLIENT_SECRET!,
      redirectUri: process.env.OAUTH_42_REDIRECT_URI!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectUri: process.env.TWITTER_REDIRECT_URI!,
    },
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    from: {
      email: process.env.FROM_EMAIL!,
      name: process.env.FROM_NAME!,
    },
  },

  // File Storage Configuration
  storage: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    downloadPath: process.env.DOWNLOAD_PATH || './downloads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    maxDownloadSize: parseInt(process.env.MAX_DOWNLOAD_SIZE || '5368709120', 10),
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    sessionSecret: process.env.SESSION_SECRET!,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Development Configuration
  development: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableCors: process.env.ENABLE_CORS === 'true',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
  npm:
  {
    version: process.env.NPM_VERSION
  }
};

// Validate required environment variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TMDB_API_KEY',
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}
