import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import passport from './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import timeEntryRoutes from './routes/timeEntryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS設定
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// セッション設定
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24時間
    },
  })
);

// Passport設定
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティング
app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// エラーハンドリング
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

