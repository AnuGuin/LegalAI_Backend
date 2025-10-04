import app from './app.js';
import { logger } from './utils/logger.js';
import prisma from './config/database.js';

const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    if (process.env.NODE_ENV === 'production') {
      const { execSync } = require('child_process');
      try {
        logger.info('🔄 Running database migrations...');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        logger.info('✅ Migrations completed');
      } catch (error) {
        logger.warn('⚠️ Migration warning:', error);
      }
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}