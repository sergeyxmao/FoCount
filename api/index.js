import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';

import { registerProxyRoutes } from './routes/proxy.js';
import { registerChatRoutes } from './routes/chats.js';
import { registerNotificationRoutes } from './routes/notifications.js';

dotenv.config();

const app = Fastify({ logger: true });

// Подключение к БД
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// CORS
await app.register(cors, {
  origin: true,
  credentials: true
});

// Middleware: проверка JWT
async function authenticateToken(req, reply) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return reply.code(401).send({ error: 'Требуется авторизация' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return reply.code(403).send({ error: 'Невалидный токен' });
  }
}

// Регистрация маршрутов
registerProxyRoutes(app, authenticateToken);
registerChatRoutes(app, pool, authenticateToken);
registerNotificationRoutes(app, pool, authenticateToken);

// Healthcheck
app.get('/health', async () => {
  return { status: 'ok', service: 'FOgrup API', version: '1.0.0' };
});

// Запуск
const PORT = process.env.PORT || 4001;
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 FOgrup API running on ${address}`);
});
