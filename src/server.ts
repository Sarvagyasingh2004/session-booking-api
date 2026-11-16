import { Server } from 'http';
import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { Session } from './models/session.model';
import { Teacher } from './models/teacher.model';
import { User } from './models/user.model';

let server: Server | undefined;

const start = async (): Promise<void> => {
  await connectDB();

  await Promise.all([User.init(), Teacher.init(), Session.init()]);

  server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
};

const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received, shutting down`);
  server?.close();
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
