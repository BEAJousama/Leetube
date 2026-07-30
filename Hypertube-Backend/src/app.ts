import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { config } from './config/environment';
import { logger } from './shared/utils/logger';
import { MemoryMonitor } from './shared/utils/memory-monitor';

// Import services first and initialize them
import { initializeServices } from './services';

// Initialize services immediately
initializeServices();

// Import routes (after services are initialized)
import authRoutes from './modules/auth.routes';
import userRoutes from './modules/user.routes';
import movieRoutes from './modules/movie.routes';
import commentRoutes from './modules/comment.routes';
import torrentRoutes from './modules/torrent.routes';

// Import middleware
import { errorHandler } from './shared/middleware/error.middleware';
import { notFoundHandler } from './shared/middleware/notFound.middleware';
import { loggerMiddleware } from './shared/middleware/logger.middleware';

// Import cron jobs
import { scheduleCronJobs } from './shared/core/cron.jobs';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  public port: string | number;

  constructor() {
    this.app = express();
    this.port = config.port || 3000;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        // Allow localhost and common LAN network ranges
        const allowedOrigins = [
          config.frontendUrl,
          config.baseUrl,
        ];
        
        // Check for localhost variations
        const localhostRegex = /^http?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        
        // Check for any private IP address (much more flexible!)
        // This covers ALL possible private networks:
        // - 10.0.0.0 to 10.255.255.255
        // - 172.16.0.0 to 172.31.255.255  
        // - 192.168.0.0 to 192.168.255.255
        // - Plus any other custom IP ranges
        const privateIPRegex = /^http?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/;

        //Accept hostnames that ends with 1337.ma
        const customDomainRegex = /^http?:\/\/([a-zA-Z0-9-]+\.)*1337\.ma(:\d+)?$/;
        
        // Also allow any IP in development mode for maximum flexibility
        const anyIPRegex = /^http?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;
        
        if (allowedOrigins.includes(origin) || 
            localhostRegex.test(origin) || 
            privateIPRegex.test(origin) ||
            customDomainRegex.test(origin) ||
            (config.nodeEnv === 'development' && anyIPRegex.test(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Rate limiting
    // const limiter = rateLimit({
    //   windowMs: 15 * 60 * 1000, // 15 minutes
    //   max: 100000, // limit each IP to 100000 requests per windowMs
    //   message: 'Too many requests from this IP, please try again later.',
    //   standardHeaders: true,
    //   legacyHeaders: false,
    // });
    // this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
    this.app.use(loggerMiddleware);

    // Static files - serve from shared data directory
    this.app.use('/uploads', express.static('/app/uploads'));
    this.app.use('/downloads', express.static('/app/downloads'));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'hypertube-monolith',
        version: config.npm.version || '1.0.0',
        environment: config.nodeEnv || 'development',
      });
    });

    // Memory monitoring endpoint
    this.app.get('/memory', (req: Request, res: Response) => {
      const memoryMonitor = MemoryMonitor.getInstance();
      const stats = memoryMonitor.getMemoryStats();
      
      res.status(200).json({
        status: stats.heapPercentage > 80 ? 'WARNING' : 'OK',
        timestamp: new Date().toISOString(),
        memory: stats,
        uptime: process.uptime(),
      });
    });

    // Import Swagger dynamically to avoid initialization issues
    const { swaggerUi, specs } = require('./config/swagger');

    // Explicitly serve swagger.json before swagger UI middleware
    this.app.get('/api/docs/swagger.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });

    // Swagger documentation
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    }));

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/movies', movieRoutes);
    this.app.use('/api/comments', commentRoutes);
    this.app.use('/api/torrent', torrentRoutes);

    // API documentation (if needed)
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        message: 'Hypertube API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          movies: '/api/movies',
          comments: '/api/comments',
          torrent: '/api/torrent',
        },
        documentation: '/api/docs',
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info(`Hypertube server running on port ${this.port}`);
      logger.info(`Environment: ${config.nodeEnv || 'development'}`);
      logger.info(`Health check: http://localhost:${this.port}/health`);
      logger.info(`API base: http://localhost:${this.port}/api`);
      logger.info(`API Documentation: http://localhost:${this.port}/api/docs`);
      
      // Initialize cron jobs after server starts
      // if (config.nodeEnv === 'production' || config.enableCronJobs === 'true') {
        scheduleCronJobs();
      // } else {
      //   logger.info('Cron jobs disabled in development mode');
      // }
    });
  }
}

export default App;
