import { Server } from 'node:http';
import app from './app';
import { validateEnv } from './config/env.config';
import { prisma } from './lib/prisma';

const env = validateEnv();
const PORT = Number(env.PORT);

let server: Server | undefined;
let shuttingDown = false;

async function shutdown(signal: string, exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.error(`${signal} received, shutting down`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await prisma.$disconnect();
    process.exit(exitCode);
  } catch (error) {
    console.error('Shutdown failed', error);
    process.exit(1);
  }
}

async function start() {
  try {
    await prisma.$connect();

    server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    server.on('error', async (error) => {
      console.error('HTTP server error', error);
      await shutdown('SERVER_ERROR', 1);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
  void shutdown('UNHANDLED_REJECTION', 1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error);
  void shutdown('UNCAUGHT_EXCEPTION', 1);
});

void start();
