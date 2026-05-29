// ─────────────────────────────────────────────────────────────────────────────
// APP.TS — Express App Configuration
// ─────────────────────────────────────────────────────────────────────────────
// 📘 This file creates and configures the Express app.
// We separate app creation (app.ts) from server startup (server.ts) so
// that we can import the app in tests without starting the server.
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import routes from './routes/index';
import { notFound, globalErrorHandler } from './middleware/error.middleware';

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// helmet — sets secure HTTP headers to protect against common attacks
// (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// cors — allows frontend apps to call this API
// Without this, browsers block cross-origin requests
app.use(cors({
  origin: [env.CUSTOMER_APP_URL, env.ADMIN_PANEL_URL, 'http://localhost:*'],
  credentials: true, // allows cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// rate limiting — max 100 requests per 15 minutes per IP
// Prevents brute force attacks and API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for OTP (prevent SMS bombing)
// Dev: unlimited | Production: max 5 per hour per IP
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.isDev ? 1000 : 5, // effectively unlimited in dev
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 1 hour.',
  },
});
app.use('/api/auth/send-otp', otpLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// PARSING MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// Parse incoming JSON bodies (req.body)
// limit: '10mb' → max request size (prevents huge payload attacks)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data (form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// morgan — logs every HTTP request to terminal
// 'dev' format: GET /api/auth/send-otp 200 23ms
// 'combined' format: more detailed logs for production
app.use(morgan(env.isDev ? 'dev' : 'combined'));

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Mount all API routes under /api prefix
// e.g., /api/auth/send-otp, /api/users/profile
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🌟 Welcome to 7StarExperts API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING (must be LAST)
// ─────────────────────────────────────────────────────────────────────────────

// Catch-all for undefined routes
app.use(notFound);

// Global error handler — formats all errors
app.use(globalErrorHandler);

export default app;
