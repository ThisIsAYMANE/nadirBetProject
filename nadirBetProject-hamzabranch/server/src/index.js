import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool, db } from './database/db.js';
import settlementService from './services/SettlementService.js';
import gamesCache from './services/GamesCache.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import brokerRoutes from './routes/brokers.js';
import transactionRoutes from './routes/transactions.js';
import dashboardRoutes from './routes/dashboard.js';
import kpiRoutes from './routes/kpis.js';
import chartRoutes from './routes/charts.js';
import cashoutRoutes from './routes/cashout.js';
import pragmaticRoutes from './routes/pragmatic.js';
import pointsRoutes from './routes/points.js';
import bettingRoutes from './routes/betting.js';
import casinoRoutes from './routes/casino.js';
import sportsRoutes from './routes/sports.js';
import { authenticateToken } from './middleware/auth.js';

// Load environment variables from 'env' file (not .env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', 'env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  // Fallback: load .env from server directory so it works with or without 'env' file
  const dotenvPath = join(__dirname, '..', '.env');
  dotenv.config({ path: dotenvPath });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Database initialized automatically via db.js
console.log('✅ SQLite database initialized successfully');

// Middleware
app.set('trust proxy', 1); // Trust proxy for rate limiting
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
// CORS for all 3 portals (and when frontend calls backend via ngrok)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3002',
  ];

// Allow localhost / 127.0.0.1 on any port in development so ngrok + local frontend work
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (corsOrigins.indexOf(origin) !== -1) return true;
  try {
    const u = new URL(origin);
    const isLocal =
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname.endsWith('.ngrok-free.app') ||
      u.hostname.endsWith('.ngrok.app');
    if (isLocal) return true;
  } catch (_) { }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - temporarily disabled for debugging
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/brokers', authenticateToken, brokerRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/points', pointsRoutes); // Points routes have auth built-in
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/kpis', authenticateToken, kpiRoutes);
app.use('/api/charts', authenticateToken, chartRoutes);
app.use('/api/cashout-requests', authenticateToken, cashoutRoutes);
app.use('/api', pragmaticRoutes);
app.use('/api/betting', bettingRoutes);
app.use('/api/casino', casinoRoutes);
app.use('/api/sports', sportsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  // Start automatic betting settlement worker
  settlementService.startSettlementWorker();
  // API-Sports is used for football data - cron sync disabled
  // Start loading all casino games into memory (in background, non-blocking)
  // This enables instant provider/type/device filtering once ready (~2–5 min)
  gamesCache.startLoading();
});

export { pool };
