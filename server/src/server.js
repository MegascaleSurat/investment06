import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import errorHandler from './middleware/error.middleware.js';
import logger from './config/logger.js';

const createServer = () => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  }));

  // Middlewares
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));
  }

  // API Routes
  app.use('/api/v1', routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createServer;
